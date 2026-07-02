// Shared keyless geo helpers: Open-Meteo geocoding + Nominatim reverse lookup.
// Module-level caches survive between requests on a warm server.

const FETCH_TIMEOUT = 8000;

const geocodeCache = new Map();
const reverseCache = new Map();

export async function fetchJson(url, options = {}) {
  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(FETCH_TIMEOUT) });
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).hostname}`);
  return res.json();
}

export async function geocode(name) {
  const key = name.trim().toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key);

  // Nominatim first: importance ranking resolves landmarks and parks
  // ("Yellowstone" should be Wyoming, not a hamlet in Indiana)
  try {
    const results = await fetchJson(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1`,
      { headers: { "User-Agent": "waymark-rv-copilot" } }
    );
    const hit = results?.[0];
    if (hit) {
      const place = {
        city: hit.display_name?.split(",")[0] || name,
        lat: parseFloat(hit.lat),
        lon: parseFloat(hit.lon),
      };
      geocodeCache.set(key, place);
      return place;
    }
  } catch (err) {
    console.warn("Nominatim geocode failed, falling back to Open-Meteo:", err.message);
  }

  // Fallback: Open-Meteo geocoding (city names only)
  const data = await fetchJson(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en`
  );
  const hit = data.results?.[0];
  if (!hit) return null;
  const place = { city: hit.name, lat: hit.latitude, lon: hit.longitude };
  geocodeCache.set(key, place);
  return place;
}

export async function reverseGeocode(lat, lon) {
  const key = `${lat.toFixed(1)},${lon.toFixed(1)}`;
  if (reverseCache.has(key)) return reverseCache.get(key);
  try {
    const data = await fetchJson(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=8`,
      { headers: { "User-Agent": "waymark-rv-copilot" } }
    );
    const a = data.address || {};
    const name = a.city || a.town || a.village || a.county || data.name || "Waypoint";
    reverseCache.set(key, name);
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
