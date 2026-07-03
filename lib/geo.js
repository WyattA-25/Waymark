// Shared keyless geo helpers: Open-Meteo geocoding + Nominatim reverse lookup.
// Module-level caches survive between requests on a warm server.

const FETCH_TIMEOUT = 8000;

const geocodeCache = new Map();
const reverseCache = new Map();

// Caches are keyed by user input, so cap them; Maps iterate in insertion
// order, making the first key the oldest.
function cachePut(cache, key, value) {
  if (cache.size >= 500) cache.delete(cache.keys().next().value);
  cache.set(key, value);
}

// Retries exactly once on network errors, timeouts, and 5xx responses.
// 4xx responses fail fast (retrying a bad request never helps).
// Each attempt gets its own timeout. Callers with their own fallback
// provider pass attempts: 1 so a dead upstream fails over quickly.
export async function fetchJson(url, { attempts = 2, timeout = FETCH_TIMEOUT, ...options } = {}) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetch(url, { ...options, signal: AbortSignal.timeout(timeout) });
      if (!res.ok) {
        const err = new Error(`${res.status} from ${new URL(url).hostname}`);
        err.status = res.status;
        throw err;
      }
      return await res.json();
    } catch (err) {
      const isClientError = typeof err.status === "number" && err.status >= 400 && err.status < 500;
      if (attempt === attempts - 1 || isClientError) throw err;
    }
  }
}

export async function geocode(name) {
  const key = name.trim().toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key);

  // Nominatim first: importance ranking resolves landmarks and parks
  // ("Yellowstone" should be Wyoming, not a hamlet in Indiana)
  try {
    const results = await fetchJson(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1`,
      { headers: { "User-Agent": "waymark-rv-copilot (github.com/WyattA-25/Waymark)" } }
    );
    const hit = results?.[0];
    if (hit) {
      const lat = parseFloat(hit.lat);
      const lon = parseFloat(hit.lon);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        const place = { city: hit.display_name?.split(",")[0] || name, lat, lon };
        cachePut(geocodeCache, key, place);
        return place;
      }
    }
  } catch (err) {
    console.warn("Nominatim geocode failed, falling back to Open-Meteo:", err.message);
  }

  // Fallback: Open-Meteo geocoding (city names only)
  const data = await fetchJson(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en`
  );
  const hit = data.results?.[0];
  if (!hit || !Number.isFinite(hit.latitude) || !Number.isFinite(hit.longitude)) return null;
  const place = { city: hit.name, lat: hit.latitude, lon: hit.longitude };
  cachePut(geocodeCache, key, place);
  return place;
}

export async function reverseGeocode(lat, lon) {
  const key = `${lat.toFixed(1)},${lon.toFixed(1)}`;
  if (reverseCache.has(key)) return reverseCache.get(key);
  try {
    const data = await fetchJson(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=8`,
      { headers: { "User-Agent": "waymark-rv-copilot (github.com/WyattA-25/Waymark)" } }
    );
    const a = data.address || {};
    const name = a.city || a.town || a.village || a.county || data.name || "Waypoint";
    cachePut(reverseCache, key, name);
    return name;
  } catch {
    return "Waypoint";
  }
}

// Origin + evenly spaced named waypoints + destination
export async function routeStops(from, to, midpointCount = 3) {
  const [origin, dest] = await Promise.all([geocode(from), geocode(to)]);
  if (!origin || !dest) return { error: !origin ? from : to };
  const midpoints = await Promise.all(
    Array.from({ length: midpointCount }, async (_, i) => {
      const f = (i + 1) / (midpointCount + 1);
      const lat = origin.lat + (dest.lat - origin.lat) * f;
      const lon = origin.lon + (dest.lon - origin.lon) * f;
      return { city: await reverseGeocode(lat, lon), lat, lon };
    })
  );
  return { stops: [origin, ...midpoints, dest] };
}

export function weatherStatus(code, wind) {
  if (wind >= 35) return "HIGH WIND";
  if (wind >= 20) return "Breezy";
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly Cloudy";
  if (code <= 49) return "Foggy";
  if (code <= 69) return "Rain";
  if (code <= 79) return "Snow";
  if (code <= 99) return "Storms";
  return "Clear";
}
