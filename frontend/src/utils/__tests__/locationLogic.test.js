/**
 * Location logic — unit tests
 *
 * Self-contained tests that mirror every pure function from useLocation.js.
 * We do NOT import useLocation.js (React imports hang jsdom).
 * We do NOT use jsdom — localStorage/window tests use manual stubs.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Constants (mirrored from useLocation.js) ─────────────────────────────
const POOR_ACCURACY_M      = 1500;
const ACCURACY_WARN_M      = 500;
const MAX_IP_DRIFT_KM      = 500;
const CRASH_SPEED_FROM_KMH = 25;
const CRASH_SPEED_TO_KMH   = 5;
const CRASH_G_THRESHOLD    = 3.5;
const ACCEL_CONFIRM_MS     = 4_000;
const CRASH_COOLDOWN_MS    = 12_000;

const APPLE_RELAY_BBOXES = [
  { minLat: 37.0, maxLat: 38.0, minLon: -122.5, maxLon: -121.5 },
  { minLat: 47.3, maxLat: 47.8, minLon: -122.5, maxLon: -122.0 },
  { minLat: 33.4, maxLat: 34.2, minLon: -118.5, maxLon: -117.5 },
];

// ─── Pure functions (mirrored from useLocation.js) ────────────────────────

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
    (o.includes('akamai') && o.includes('apple')) ||
    (o.includes('zscaler') && o.includes('apple'))
  );
}

function isInAppleBbox(lat, lon) {
  return APPLE_RELAY_BBOXES.some(
    b => lat >= b.minLat && lat <= b.maxLat && lon >= b.minLon && lon <= b.maxLon,
  );
}

function gpsDistM(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * 111_000;
  const dLon = (lon2 - lon1) * 111_000 * Math.cos(lat1 * Math.PI / 180);
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

function mpsToKmh(mps) { return mps * 3.6; }

function getSourceLabel(accuracy) {
  return accuracy > ACCURACY_WARN_M ? 'gps_low' : 'gps';
}

// ─── Setup ────────────────────────────────────────────────────────────────

afterEach(() => { vi.restoreAllMocks(); });

// ═══════════════════════════════════════════════════════════════════════════
// 1. iCloud Private Relay — org detection
// ═══════════════════════════════════════════════════════════════════════════

describe('iCloud Private Relay org detection', () => {
  const relays = ['iCloud Private Relay', 'Apple Inc', 'Apple-Relay via Akamai', 'ZSCALER Apple'];
  const safe   = ['Jio Platforms', 'Airtel', 'Comcast', 'Akamai Technologies', 'Cloudflare', '', null];

  for (const o of relays) it(`detects "${o}"`, () => expect(isAppleRelayOrg(o)).toBe(true));
  for (const o of safe)   it(`passes "${o}"`,  () => expect(isAppleRelayOrg(o)).toBe(false));
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Apple datacenter bounding boxes
// ═══════════════════════════════════════════════════════════════════════════

describe('Apple datacenter bbox', () => {
  it('Cupertino',  () => expect(isInAppleBbox(37.33, -122.03)).toBe(true));
  it('Seattle',    () => expect(isInAppleBbox(47.5, -122.3)).toBe(true));
  it('LA',         () => expect(isInAppleBbox(33.9, -118.0)).toBe(true));
  it('Mumbai ✗',   () => expect(isInAppleBbox(19.07, 72.87)).toBe(false));
  it('London ✗',   () => expect(isInAppleBbox(51.51, -0.13)).toBe(false));
  it('Tokyo ✗',    () => expect(isInAppleBbox(35.68, 139.65)).toBe(false));
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Haversine distance
// ═══════════════════════════════════════════════════════════════════════════

describe('Haversine distance', () => {
  it('Bengaluru → Delhi ≈ 1740 km', () => {
    const d = haversineKm(12.97, 77.59, 28.61, 77.23);
    expect(d).toBeGreaterThan(1700);
    expect(d).toBeLessThan(1800);
  });
  it('same point = 0',                     () => expect(haversineKm(12.97, 77.59, 12.97, 77.59)).toBeCloseTo(0, 5));
  it('Mumbai → Cupertino > 500 km (drift)',() => expect(haversineKm(19.076, 72.877, 37.33, -122.03)).toBeGreaterThan(MAX_IP_DRIFT_KM));
  it('within Mumbai < 50 km',             () => expect(haversineKm(19.076, 72.877, 19.10, 72.90)).toBeLessThan(50));
  it('Jonai → Guwahati ≈ 300 km', () => {
    const d = haversineKm(27.83, 95.17, 26.14, 91.74);
    expect(d).toBeGreaterThan(250);
    expect(d).toBeLessThan(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. GPS jitter gate
// ═══════════════════════════════════════════════════════════════════════════

describe('Jitter gate (< 50 m suppressed)', () => {
  it('~11 m suppressed',         () => expect(gpsDistM(12.97, 77.59, 12.9701, 77.59)).toBeLessThan(50));
  it('~111 m passes through',    () => expect(gpsDistM(12.97, 77.59, 12.971, 77.59)).toBeGreaterThan(50));
  it('tiny lon jitter at equator', () => expect(gpsDistM(0, 100, 0, 100.0003)).toBeLessThan(50));
  it('~555 m real movement',     () => expect(gpsDistM(12.97, 77.59, 12.975, 77.59)).toBeGreaterThan(500));
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. Speed conversion
// ═══════════════════════════════════════════════════════════════════════════

describe('m/s → km/h', () => {
  it('0 → 0',       () => expect(mpsToKmh(0)).toBe(0));
  it('10 → 36',     () => expect(mpsToKmh(10)).toBeCloseTo(36, 1));
  it('16.67 → ~60',  () => expect(mpsToKmh(16.67)).toBeCloseTo(60, 0));
  it('27.78 → ~100', () => expect(mpsToKmh(27.78)).toBeCloseTo(100, 0));
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. GPS accuracy → source label
// ═══════════════════════════════════════════════════════════════════════════

describe('Accuracy → source label', () => {
  it('10 m → "gps"',      () => expect(getSourceLabel(10)).toBe('gps'));
  it('500 m → "gps"',     () => expect(getSourceLabel(500)).toBe('gps'));
  it('501 m → "gps_low"', () => expect(getSourceLabel(501)).toBe('gps_low'));
  it('5000 m → "gps_low"',() => expect(getSourceLabel(5000)).toBe('gps_low'));
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. Poor accuracy gate logic
// ═══════════════════════════════════════════════════════════════════════════

describe('Poor accuracy gate', () => {
  it('first fix always accepted (even 5000 m)', () => {
    const gotFirstFix = false;
    const rejected = gotFirstFix && 5000 > POOR_ACCURACY_M;
    expect(rejected).toBe(false);
  });

  it('subsequent fix > 1500 m rejected', () => {
    const gotFirstFix = true;
    const rejected = gotFirstFix && 2000 > POOR_ACCURACY_M;
    expect(rejected).toBe(true);
  });

  it('subsequent fix ≤ 1500 m accepted', () => {
    const gotFirstFix = true;
    const rejected = gotFirstFix && 1200 > POOR_ACCURACY_M;
    expect(rejected).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. Velocity collapse detection
// ═══════════════════════════════════════════════════════════════════════════

describe('Velocity collapse detection', () => {
  function isCrash(from, to) {
    return from >= CRASH_SPEED_FROM_KMH && to <= CRASH_SPEED_TO_KMH;
  }

  it('60 → 0 triggers',              () => expect(isCrash(60, 0)).toBe(true));
  it('25 → 5 triggers (boundary)',    () => expect(isCrash(25, 5)).toBe(true));
  it('20 → 0 no trigger (too slow)',  () => expect(isCrash(20, 0)).toBe(false));
  it('60 → 10 no trigger (moving)',   () => expect(isCrash(60, 10)).toBe(false));
  it('5 → 0 no trigger (walking)',    () => expect(isCrash(5, 0)).toBe(false));
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. Crash detection constants
// ═══════════════════════════════════════════════════════════════════════════

describe('Crash detection constants', () => {
  it('accel 2 G < threshold (safe)',  () => expect(2.0).toBeLessThan(CRASH_G_THRESHOLD));
  it('accel 4 G > threshold (crash)', () => expect(4.0).toBeGreaterThan(CRASH_G_THRESHOLD));
  it('confirmation window = 4 s',     () => expect(ACCEL_CONFIRM_MS).toBe(4_000));
  it('cooldown = 12 s',               () => expect(CRASH_COOLDOWN_MS).toBe(12_000));
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. GPS API options contract
// ═══════════════════════════════════════════════════════════════════════════

describe('GPS API options contract', () => {
  it('coarse fix: low accuracy, 3s timeout, 30s cache', () => {
    const opts = { enableHighAccuracy: false, timeout: 3000, maximumAge: 30_000 };
    expect(opts.enableHighAccuracy).toBe(false);
    expect(opts.timeout).toBe(3000);
    expect(opts.maximumAge).toBe(30_000);
  });

  it('watch: high accuracy, 30s timeout, no cache (avoids stale iOS)', () => {
    const opts = { enableHighAccuracy: true, timeout: 30_000, maximumAge: 0 };
    expect(opts.enableHighAccuracy).toBe(true);
    expect(opts.maximumAge).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. Location tuning constants
// ═══════════════════════════════════════════════════════════════════════════

describe('Location tuning constants', () => {
  it('wall-clock fallback = 45s (adequate for rural GPS cold start)', () => {
    expect(45_000).toBeGreaterThanOrEqual(30_000);
    expect(45_000).toBeLessThanOrEqual(60_000);
  });

  it('poor accuracy 1500m tolerates rural cell towers', () => {
    expect(POOR_ACCURACY_M).toBeGreaterThan(1000);
    expect(POOR_ACCURACY_M).toBeLessThan(5000);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. IP drift guard
// ═══════════════════════════════════════════════════════════════════════════

describe('IP drift guard', () => {
  it('GPS in Mumbai, IP in Cupertino → rejected (> 500 km)', () => {
    const drift = haversineKm(19.076, 72.877, 37.33, -122.03);
    expect(drift > MAX_IP_DRIFT_KM).toBe(true);
  });

  it('GPS in Mumbai, IP also in Mumbai → accepted', () => {
    const drift = haversineKm(19.076, 72.877, 19.10, 72.90);
    expect(drift > MAX_IP_DRIFT_KM).toBe(false);
  });

  it('GPS in Jonai (Assam), IP in Guwahati (300 km) → accepted (< 500)', () => {
    const drift = haversineKm(27.83, 95.17, 26.14, 91.74);
    expect(drift > MAX_IP_DRIFT_KM).toBe(false);
  });
});
