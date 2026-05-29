import { useState, useEffect, useRef, useCallback } from 'react';

// ─── GPS acquisition tuning ─────────────────────────────────────────────────
// These values are calibrated for users in remote areas (rural Assam,
// Himalayan villages, etc.) where GPS cold-start can take 30-60 s and signal
// drops are frequent.  The original 10 s timeout meant every rural user
// silently fell back to IP geolocation, which returns the mobile carrier's
// gateway location — often hundreds of km from the actual user.
const FIRST_FIX_WALL_CLOCK_MS = 45_000;   // give GPS up to 45 s to get a first fix
const PER_ATTEMPT_TIMEOUT_MS  = 30_000;   // browser internal per-attempt timeout
const POOR_ACCURACY_M         = 1500;     // tolerate up to 1.5 km accuracy (rural cell-tower)
const ACCURACY_WARN_M         = 500;      // flag fixes worse than 500 m as 'gps_low'

// ─── GPS velocity crash detection ───────────────────────────────────────────
const VELOCITY_WINDOW_MS    = 6_000; // look back far enough to see sustained speed + the drop
const CRASH_SPEED_FROM_KMH  = 40;    // must have been at sustained highway speed...
const CRASH_SPEED_TO_KMH    = 5;     // ...then collapse to a near-standstill
const CRASH_DROP_MAX_MS     = 2_500; // the high→low collapse must happen this fast (rules out normal braking)
const MIN_SUSTAINED_SAMPLES = 2;     // ≥this many high-speed fixes (rules out single GPS glitches)

// ─── Accelerometer crash detection ──────────────────────────────────────────
// Accelerometer is a CONFIRMATION signal only — it never fires alone.
// Reason: a thrown or dropped phone easily hits 3.5 G, creating false alarms.
// We only use the accel spike to confirm what GPS velocity already suspects.
const CRASH_G_THRESHOLD  = 3.5;   // G-force that counts as a spike
const ACCEL_CONFIRM_MS   = 4_000; // accel must agree with GPS within this window
const CRASH_COOLDOWN_MS  = 12_000;

function mpsToKmh(mps) { return mps * 3.6; }

// ─── iCloud Private Relay guard ─────────────────────────────────────────────
// Apple routes Private Relay exit traffic through third-party CDN nodes
// (Akamai, Cloudflare, ZSCALER, etc.) so the ASN/org label is NOT always
// "apple inc" or "icloud private relay". We use three layers:
//
//   1. ASN/org string check  — catches explicitly labelled Apple exits
//   2. Plausibility check    — if we have a recent GPS fix, the IP location
//      must be within MAX_IP_DRIFT_KM km of it; a 500+ km mismatch means
//      the IP is routing through a proxy/relay, not the user's real ISP
//   3. Apple datacenter bbox — a bounding box of known Apple relay PoPs
//      (Cupertino HQ area and primary US relay cluster).  Coordinates
//      matching these boxes while the user is obviously NOT in the US
//      (detected via GPS country_code or browser locale) are rejected.

const MAX_IP_DRIFT_KM = 500; // beyond this the IP is clearly not the user's ISP

// Known Apple relay clusters (approximate bounding boxes)
const APPLE_RELAY_BBOXES = [
  { minLat: 37.0, maxLat: 38.0, minLon: -122.5, maxLon: -121.5 }, // Cupertino/SJC area
  { minLat: 47.3, maxLat: 47.8, minLon: -122.5, maxLon: -122.0 }, // Seattle relay
  { minLat: 33.4, maxLat: 34.2, minLon: -118.5, maxLon: -117.5 }, // Los Angeles relay
];

// Haversine distance in km
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isAppleRelayOrg(org) {
  const o = (org || '').toLowerCase();
  return (
    o.includes('icloud private relay') ||
    o.includes('apple inc') ||
    o.includes('apple-relay') ||
    // Apple uses Akamai and Cloudflare for relay exits; we can't block all
    // Akamai/CF traffic but the ASN owner field sometimes reads "Apple Inc"
    (o.includes('akamai') && o.includes('apple')) ||
    (o.includes('zscaler') && o.includes('apple'))
  );
}

function isInAppleDatacenterBbox(lat, lon) {
  return APPLE_RELAY_BBOXES.some(
    b => lat >= b.minLat && lat <= b.maxLat && lon >= b.minLon && lon <= b.maxLon
  );
}

/**
 * IP-based geolocation fallback.
 * Returns { lat, lon, country_code } on success,
 *         { error: string }           if the IP looks like a relay/proxy,
 *         null                        if the fetch failed.
 *
 * @param {{ lat: number, lon: number } | null} lastGps — most recent GPS fix,
 *   used for drift validation. Pass null if no GPS fix has been received yet.
 */
async function ipFallback(lastGps = null) {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (!data.latitude || !data.longitude) return null;

    const ipLat = data.latitude;
    const ipLon = data.longitude;
    const org   = data.org || '';

    // Layer 1: org name
    if (isAppleRelayOrg(org)) {
      return { error: 'Location hidden by iCloud Private Relay. Please allow GPS or set location manually.' };
    }

    // Layer 2: drift vs last GPS fix
    if (lastGps?.lat && lastGps?.lon) {
      const driftKm = haversineKm(lastGps.lat, lastGps.lon, ipLat, ipLon);
      if (driftKm > MAX_IP_DRIFT_KM) {
        return { error: 'Location hidden by iCloud Private Relay. Please allow GPS or set location manually.' };
      }
    }

    // Layer 3: Apple datacenter bbox (only meaningful if user is clearly NOT in the US)
    // We use country_code from the IP response itself; if it says US but the
    // browser locale is clearly non-US, flag it.
    const browserLocale = (navigator.language || 'en').toLowerCase();
    const userIsLikelyUS = data.country_code === 'US' && browserLocale.endsWith('-us');
    if (!userIsLikelyUS && isInAppleDatacenterBbox(ipLat, ipLon)) {
      return { error: 'Location hidden by iCloud Private Relay. Please allow GPS or set location manually.' };
    }

    return { lat: ipLat, lon: ipLon, country_code: data.country_code };
  } catch { /* silent */ }
  return null;
}

// Custom event name used to sync manual-location state across running hooks.
const MANUAL_LOC_EVENT = 'roadsos:manual-location';
// Custom event name used to force a fresh GPS acquisition from anywhere.
const GPS_REFRESH_EVENT = 'roadsos:gps-refresh';

/**
 * Set location manually (e.g., user taps on map or searches address).
 * Stores in localStorage AND notifies any live useLocation() instances so
 * activeLocation updates immediately without a full reload.
 */
export function setManualLocation(lat, lon, landmark) {
  const manualLoc = { lat, lon, landmark };
  try {
    localStorage.setItem('roadsos:manual-location', JSON.stringify(manualLoc));
  } catch { /* storage full or disabled */ }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(MANUAL_LOC_EVENT, { detail: { lat, lon, landmark } })
    );
  }
  return manualLoc;
}

/**
 * Clear manual location override and resume GPS detection.
 * The GPS watchPosition that's already running will supply the next fix.
 */
export function clearManualLocation() {
  try {
    localStorage.removeItem('roadsos:manual-location');
  } catch { /* silent */ }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MANUAL_LOC_EVENT, { detail: null }));
  }
}

/**
 * Force a fresh GPS acquisition from anywhere in the app.
 * Clears any manual override, then signals the live useLocation() hook to
 * re-acquire a fresh fix (bypassing browser cache via maximumAge: 0).
 * Returns a promise that resolves when the new fix is set (or after timeout).
 */
export function refreshGpsLocation() {
  // Clear manual override so live GPS can take over
  try {
    localStorage.removeItem('roadsos:manual-location');
  } catch { /* silent */ }

  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);
    // Dispatch the refresh event with a callback in detail
    window.dispatchEvent(new CustomEvent(GPS_REFRESH_EVENT, { detail: { resolve } }));
    // Safety timeout — never block UI longer than 12 s
    setTimeout(() => resolve(null), 12_000);
  });
}

/**
 * Request DeviceMotion permission on iOS 13+.
 * Must be called from a user-gesture handler (button tap).
 * No-op on Android / desktop.
 */
export async function requestMotionPermission() {
  if (
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof DeviceMotionEvent.requestPermission === 'function'
  ) {
    try {
      return await DeviceMotionEvent.requestPermission();
    } catch {
      return 'denied';
    }
  }
  return 'granted'; // Android / desktop never need explicit permission
}

export function useLocation({ onCrashDetected } = {}) {
  // Try to restore manual override from localStorage
  const getInitialLocation = () => {
    try {
      const stored = localStorage.getItem('roadsos:manual-location');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...parsed, source: 'manual' };
      }
    } catch { /* silent */ }
    return null;
  };

  const [location, setLocation]   = useState(getInitialLocation());
  const [error, setError]         = useState(null);
  const [loading, setLoading]     = useState(!location); // false if manual location loaded

  // ─── Live sync for manual-location changes ──────────────────────────────
  // When setManualLocation() / clearManualLocation() are called from anywhere
  // (e.g. ManualLocationModal), update React state so App.jsx's activeLocation
  // and the downstream /search call update immediately without a page reload.
  useEffect(() => {
    const handler = (e) => {
      if (e.detail) {
        const { lat, lon, landmark } = e.detail;
        setLocation({ lat, lon, landmark, source: 'manual' });
        setLoading(false);
        setError(null);
      } else {
        // Manual location cleared — let the running GPS watch take over.
        // Don't force loading=true; the GPS watch will call setLocation on
        // the next fix.  Just wipe the manual state so the map recentres.
        setLocation(null);
      }
    };
    window.addEventListener(MANUAL_LOC_EVENT, handler);
    return () => window.removeEventListener(MANUAL_LOC_EVENT, handler);
  }, []);

  // ─── Force GPS refresh handler ──────────────────────────────────────────
  // When refreshGpsLocation() is called from anywhere, force a fresh
  // getCurrentPosition with maximumAge: 0 (bypasses browser cache) and
  // commit the result to React state so the UI updates immediately.
  useEffect(() => {
    const handler = (e) => {
      const resolveCb = e?.detail?.resolve;
      if (!navigator.geolocation) {
        resolveCb?.(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, speed, accuracy } = pos.coords;
          const speedKmh = speed != null ? mpsToKmh(speed) : 0;
          // Mark this fix as authoritative so subsequent watchPosition
          // jitter-gate logic doesn't reject it.
          gotFirstFixRef.current = true;
          lastReportedRef.current = { lat: latitude, lon: longitude };
          const newLoc = {
            lat: latitude,
            lon: longitude,
            speedKmh,
            accuracy,
            source: accuracy > ACCURACY_WARN_M ? 'gps_low' : 'gps',
          };
          setLocation(newLoc);
          setLoading(false);
          setError(null);
          resolveCb?.(newLoc);
        },
        (err) => {
          setError(
            err.code === 1
              ? 'Please allow location access to refresh.'
              : 'GPS refresh failed — try again or move to an open area.'
          );
          resolveCb?.(null);
        },
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
      );
    };
    window.addEventListener(GPS_REFRESH_EVENT, handler);
    return () => window.removeEventListener(GPS_REFRESH_EVENT, handler);
  }, []);

  const speedHistoryRef      = useRef([]);
  const watchIdRef           = useRef(null);
  const locationRef          = useRef(null);    // always-current location for callbacks
  const crashFiredRef        = useRef(false);   // de-duplicate alerts
  const gpsCollapseTimeRef   = useRef(null);    // timestamp of last GPS velocity collapse
  const accelSpikeTimeRef    = useRef(null);    // timestamp of last accelerometer spike

  // Keep locationRef in sync
  useEffect(() => { locationRef.current = location; }, [location]);

  // ─── Shared crash trigger (de-duped) ────────────────────────────────────
  const fireCrash = useCallback((trigger) => {
    if (crashFiredRef.current) return;
    crashFiredRef.current = true;
    onCrashDetected?.({ ...locationRef.current, trigger });
    // Reset cooldown so a second genuine crash can still alert
    setTimeout(() => { crashFiredRef.current = false; }, CRASH_COOLDOWN_MS);
  }, [onCrashDetected]);

  // ─── GPS velocity collapse check ────────────────────────────────────────
  const checkVelocityCollapse = useCallback((speedKmh, timestamp) => {
    const history = speedHistoryRef.current;
    history.push({ speedKmh, timestamp });
    const cutoff = timestamp - VELOCITY_WINDOW_MS;
    speedHistoryRef.current = history.filter(e => e.timestamp >= cutoff);

    const recent = speedHistoryRef.current;
    if (recent.length < 2) return;

    const newest = recent[recent.length - 1];
    if (newest.speedKmh > CRASH_SPEED_TO_KMH) return; // not at a standstill yet

    // Must have been at sustained highway speed (rules out city crawl + GPS glitches).
    const fast = recent.filter(e => e.speedKmh >= CRASH_SPEED_FROM_KMH);
    if (fast.length < MIN_SUSTAINED_SAMPLES) return;

    // The drop from highway speed to standstill must be SUDDEN. A normal stop
    // (gentle deceleration over several seconds) is rejected here.
    const lastFast = fast[fast.length - 1];
    if (newest.timestamp - lastFast.timestamp > CRASH_DROP_MAX_MS) return;

    // Sudden collapse from sustained highway speed → likely crash.
    speedHistoryRef.current = [];
    gpsCollapseTimeRef.current = Date.now();

    const accelTime = accelSpikeTimeRef.current;
    if (accelTime && (Date.now() - accelTime) <= ACCEL_CONFIRM_MS) {
      fireCrash('gps+accel');   // both signals agree → high confidence
    } else {
      fireCrash('gps_velocity'); // sustained-speed sudden stop, no accel → still alert
    }
  }, [fireCrash]);

  // ─── Accelerometer G-force check ────────────────────────────────────────
  useEffect(() => {
    if (typeof DeviceMotionEvent === 'undefined') return;

    const handleMotion = (event) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc || acc.x == null) return;

      const magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
      const gForce = magnitude / 9.81;

      if (gForce > CRASH_G_THRESHOLD) {
        // Record spike time — but do NOT fire alone.
        // A throw or drop reaches 3.5 G easily. We only confirm if GPS
        // velocity has already collapsed within ACCEL_CONFIRM_MS.
        accelSpikeTimeRef.current = Date.now();

        const gpsTime = gpsCollapseTimeRef.current;
        if (gpsTime && (Date.now() - gpsTime) <= ACCEL_CONFIRM_MS) {
          fireCrash('gps+accel');  // GPS already collapsed → confirmed
        }
        // else: accel spike recorded, waiting for GPS to confirm
      }
    };

    const setup = async () => {
      // 1. iOS 13+: needs explicit requestPermission from a user gesture.
      // This may fail silently inside an effect on first load; the listener 
      // will be successfully added later once the SOS button is tapped.
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
          const perm = await DeviceMotionEvent.requestPermission();
          if (perm === 'granted') window.addEventListener('devicemotion', handleMotion);
        } catch {
          // No user gesture yet — GPS-only detection still works
        }
        return;
      }

      // 2. Firefox / modern browsers: check Permissions API before adding listener
      // to avoid the "motion sensor deprecated" console warning.
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'accelerometer' });
          if (result.state !== 'denied') {
            window.addEventListener('devicemotion', handleMotion);
          }
          return;
        } catch {
          // Browser supports Permissions API but not 'accelerometer' query — fall through
        }
      }

      // 3. Standard fallback for other browsers
      window.addEventListener('devicemotion', handleMotion);
    };

    setup();
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [fireCrash]);

  // ─── GPS watch ──────────────────────────────────────────────────────────
  const lastReportedRef = useRef(null);  // track last position we actually set
  const gotFirstFixRef  = useRef(false); // true once we've received any real GPS coords

  useEffect(() => {
    let cancelled = false;

    // ── Wall-clock fallback ──────────────────────────────────────────────
    // If we haven't received ANY GPS fix after 45 s, drop down to IP-based
    // geolocation so the user sees *something* on the map.  This timer is
    // cleared the moment the first GPS fix arrives, and is NEVER restarted —
    // so a brief signal drop later won't bounce a rural user to the carrier
    // gateway location.
    const firstFixTimer = setTimeout(async () => {
      if (cancelled || gotFirstFixRef.current) return;
      // Pass last GPS fix (if any) so ipFallback can validate drift
      const fb = await ipFallback(locationRef.current);
      if (cancelled || gotFirstFixRef.current) return;   // GPS may have raced in
      if (fb && !fb.error) {
        setLocation({
          lat: fb.lat, lon: fb.lon,
          country_code: fb.country_code,
          accuracy: null,
          source: 'ip',
        });
      } else if (fb && fb.error) {
        setError(fb.error);
      } else {
        setError('Searching for GPS signal — please move to an open area.');
      }
      setLoading(false);
    }, FIRST_FIX_WALL_CLOCK_MS);

    if (!navigator.geolocation) {
      clearTimeout(firstFixTimer);
      ipFallback(null).then(fb => {
        if (cancelled) return;
        if (fb && !fb.error) {
          setLocation({
            lat: fb.lat, lon: fb.lon,
            country_code: fb.country_code,
            source: 'ip',
          });
        } else if (fb && fb.error) {
          setError(fb.error);
        } else {
          setError('Geolocation is not supported by your browser.');
        }
        setLoading(false);
      });
      return;
    }

    // ─── Coarse fix first (network/wifi positioning in ~1–2 s) ──────────────
    // Fire getCurrentPosition with low accuracy first to show *something* on
    // the map immediately. Then the high-accuracy watchPosition upgrades it.
    // Big perceived-speed win for users on slow GPS locks.
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled || gotFirstFixRef.current) return;  // watch already won
        const { latitude, longitude, accuracy } = pos.coords;
        setLocation({
          lat: latitude,
          lon: longitude,
          accuracy,
          source: 'gps_coarse',
        });
        setLoading(false);  // unblock UI immediately
      },
      () => {},  // silent — watchPosition will still try for high accuracy
      { enableHighAccuracy: false, timeout: 3000, maximumAge: 30_000 }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (cancelled) return;
        const { latitude, longitude, speed, accuracy } = pos.coords;
        const speedKmh = speed != null ? mpsToKmh(speed) : 0;

        // 1. Reject only catastrophically bad fixes (>1500 m) — but ALWAYS
        //    accept the first fix.  A 1000-m-accurate fix in Jonai is still
        //    50× better than the carrier IP location in Guwahati.
        if (gotFirstFixRef.current && accuracy > POOR_ACCURACY_M) return;

        // 2. Distance gate: skip GPS jitter (< 50 m) — but still feed it to
        //    crash detection so a slow walking pace doesn't get rejected.
        const prev = lastReportedRef.current;
        if (prev) {
          const dLat = (latitude - prev.lat) * 111_000;
          const dLon = (longitude - prev.lon) * 111_000 * Math.cos(latitude * Math.PI / 180);
          const distM = Math.sqrt(dLat * dLat + dLon * dLon);
          if (distM < 50) {
            if (onCrashDetected && speed != null) checkVelocityCollapse(speedKmh, pos.timestamp);
            return;
          }
        }

        // 3. Real GPS fix — commit it.
        gotFirstFixRef.current  = true;
        clearTimeout(firstFixTimer);
        lastReportedRef.current = { lat: latitude, lon: longitude };
        setLocation({
          lat: latitude,
          lon: longitude,
          speedKmh,
          accuracy,
          // Flag low-accuracy fixes so the UI can warn the user.
          source: accuracy > ACCURACY_WARN_M ? 'gps_low' : 'gps',
        });
        setLoading(false);
        setError(null);
        if (onCrashDetected && speed !== null) {
          checkVelocityCollapse(speedKmh, pos.timestamp);
        }
      },
      async (err) => {
        if (cancelled) return;

        // ── CRITICAL: once we have a real GPS fix, NEVER overwrite it on
        //    transient errors.  Rural areas drop signal constantly; jumping
        //    the user's dot to the carrier IP location every time the watch
        //    errors is the exact bug that broke rural testers.
        if (gotFirstFixRef.current) return;

        // ── First fix not yet acquired.  Distinguish error kinds:
        //   1 PERMISSION_DENIED   → permanent: fall back to IP immediately
        //   2 POSITION_UNAVAILABLE → transient: keep watching, wall-clock timer handles it
        //   3 TIMEOUT             → transient: same
        if (err.code === 1) {
          clearTimeout(firstFixTimer);
          const fb = await ipFallback();
          if (cancelled) return;
          if (fb && !fb.error) {
            setLocation({
              lat: fb.lat, lon: fb.lon,
              country_code: fb.country_code,
              source: 'ip',
            });
            setError('Please allow location access for better accuracy.');
          } else if (fb && fb.error) {
            setError(fb.error);
          } else {
            setError('Please allow location access to use SOS features.');
          }
          setLoading(false);
        }
        // For code 2 / 3: do nothing — the browser will retry, and the
        // FIRST_FIX_WALL_CLOCK_MS timer will trigger IP fallback if
        // GPS truly never locks.
      },
      {
        enableHighAccuracy: true,
        timeout      : PER_ATTEMPT_TIMEOUT_MS,
        // maximumAge: 0 — never reuse cross-session cached fixes.
        // iOS Safari has been observed returning the last place the phone
        // had GPS lock (potentially weeks old) as the "current" fix.
        maximumAge   : 0,
      }
    );

    return () => {
      cancelled = true;
      clearTimeout(firstFixTimer);
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { location, error, loading };
}
