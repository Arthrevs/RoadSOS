const CACHE_KEY_PREFIX = 'roadsos_cache_';
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — hospitals don't move; stale-local beats fresh-foreign

function locationKey(lat, lon) {
  // Round to 2 decimal places (~1.1 km grid — high hit rate for same-area revisits)
  return `${CACHE_KEY_PREFIX}${lat.toFixed(2)}_${lon.toFixed(2)}`;
}

export function saveSearchResult(lat, lon, data) {
  try {
    const entry = { data, timestamp: Date.now() };
    localStorage.setItem(locationKey(lat, lon), JSON.stringify(entry));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function loadSearchResult(lat, lon) {
  try {
    const raw = localStorage.getItem(locationKey(lat, lon));
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > TTL_MS) {
      localStorage.removeItem(locationKey(lat, lon));
      return null;
    }
    return { ...entry.data, cachedAt: new Date(entry.timestamp).toLocaleString() };
  } catch {
    return null;
  }
}

export function clearCache() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_KEY_PREFIX)) keysToRemove.push(key);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {
    // silent
  }
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

/**
 * Geographically nearest NON-expired cached search within `maxKm`.
 * Turns a near-miss into a cache hit instead of dropping to the bundled
 * directory. Reuses real /search data already fetched online.
 */
export function loadNearestCached(lat, lon, maxKm = 5) {
  try {
    let best = null;
    let bestKm = Infinity;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(CACHE_KEY_PREFIX)) continue;
      const [cLatStr, cLonStr] = key.slice(CACHE_KEY_PREFIX.length).split('_');
      const cLat = parseFloat(cLatStr);
      const cLon = parseFloat(cLonStr);
      if (Number.isNaN(cLat) || Number.isNaN(cLon)) continue;
      const km = haversineKm(lat, lon, cLat, cLon);
      if (km > maxKm || km >= bestKm) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const entry = JSON.parse(raw);
      if (Date.now() - entry.timestamp > TTL_MS) {
        localStorage.removeItem(key);
        continue;
      }
      best = entry;
      bestKm = km;
    }
    if (!best) return null;
    return {
      ...best.data,
      cachedAt: new Date(best.timestamp).toLocaleString(),
      _nearestKm: Number(bestKm.toFixed(1)),
    };
  } catch {
    return null;
  }
}
