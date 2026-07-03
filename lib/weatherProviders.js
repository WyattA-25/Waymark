// Weather with provider failover: Open-Meteo first (global, keyless), then
// the National Weather Service (api.weather.gov, keyless, US-only).
// Open-Meteo gets a single short attempt so an outage fails over fast
// instead of stacking retry timeouts.

import { fetchJson, weatherStatus } from "./geo";

const OPEN_METEO_TIMEOUT = 5000;

const NWS_HEADERS = {
  "User-Agent": "waymark-rv-copilot (github.com/WyattA-25/Waymark)",
  "Accept": "application/geo+json",
};

// Gridpoint forecast URLs never change for a location; cache per rounded coord
const nwsForecastUrlCache = new Map();

function parseWind(text) {
  const nums = String(text || "").match(/\d+/g);
  return nums ? Math.max(...nums.map(Number)) : 0;
}

function statusFromText(text, wind) {
  if (wind >= 35) return "HIGH WIND";
  const t = String(text || "").toLowerCase();
  if (t.includes("thunder") || t.includes("storm")) return "Storms";
  if (t.includes("snow") || t.includes("ice") || t.includes("wintry")) return "Snow";
  if (t.includes("rain") || t.includes("shower") || t.includes("drizzle")) return "Rain";
  if (t.includes("fog") || t.includes("haze") || t.includes("smoke")) return "Foggy";
  if (wind >= 20) return "Breezy";
  if (t.includes("cloud") || t.includes("overcast")) return "Partly Cloudy";
  return "Clear";
}

async function nwsPeriods(lat, lon) {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  let url = nwsForecastUrlCache.get(key);
  if (!url) {
    const points = await fetchJson(
      `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
      { headers: NWS_HEADERS }
    );
    url = points.properties?.forecast;
    if (!url) throw new Error("NWS returned no forecast url for point");
    if (nwsForecastUrlCache.size >= 500) {
      nwsForecastUrlCache.delete(nwsForecastUrlCache.keys().next().value);
    }
    nwsForecastUrlCache.set(key, url);
  }
  const forecast = await fetchJson(url, { headers: NWS_HEADERS });
  const periods = forecast.properties?.periods;
  if (!Array.isArray(periods) || periods.length === 0) {
    throw new Error("NWS returned no forecast periods");
  }
  return periods;
}

// Current-ish conditions: { temp, wind, status }
export async function getCurrent(lat, lon) {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", lat);
    url.searchParams.set("longitude", lon);
    url.searchParams.set("current", "temperature_2m,wind_speed_10m,weather_code");
    url.searchParams.set("wind_speed_unit", "mph");
    url.searchParams.set("temperature_unit", "fahrenheit");
    url.searchParams.set("forecast_days", "1");
    const data = await fetchJson(url.toString(), { attempts: 1, timeout: OPEN_METEO_TIMEOUT });
    const temp = Math.round(data.current.temperature_2m);
    const wind = Math.round(data.current.wind_speed_10m);
    return { temp, wind, status: weatherStatus(data.current.weather_code, wind) };
  } catch (err) {
    console.warn("Open-Meteo current failed, using NWS:", err.message);
    const periods = await nwsPeriods(lat, lon);
    const p = periods[0];
    const wind = parseWind(p.windSpeed);
    return { temp: Math.round(p.temperature), wind, status: statusFromText(p.shortForecast, wind) };
  }
}

// Daily outlook, normalized to [{ temp, low, wind, precip, status }]
export async function getDaily(lat, lon, days) {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", lat);
    url.searchParams.set("longitude", lon);
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_probability_max,weather_code");
    url.searchParams.set("wind_speed_unit", "mph");
    url.searchParams.set("temperature_unit", "fahrenheit");
    url.searchParams.set("forecast_days", String(days));
    url.searchParams.set("timezone", "auto");
    const data = await fetchJson(url.toString(), { attempts: 1, timeout: OPEN_METEO_TIMEOUT });
    const d = data.daily;
    return d.temperature_2m_max.slice(0, days).map((_, i) => {
      const wind = Math.round(d.wind_speed_10m_max[i]);
      return {
        temp: Math.round(d.temperature_2m_max[i]),
        low: Math.round(d.temperature_2m_min[i]),
        wind,
        precip: d.precipitation_probability_max[i] ?? 0,
        status: weatherStatus(d.weather_code[i], wind),
      };
    });
  } catch (err) {
    console.warn("Open-Meteo daily failed, using NWS:", err.message);
    const periods = await nwsPeriods(lat, lon);
    const highs = periods.filter(p => p.isDaytime);
    const lows = periods.filter(p => !p.isDaytime);
    if (highs.length === 0) throw new Error("NWS returned no daytime periods");
    return Array.from({ length: days }, (_, i) => {
      const hi = highs[Math.min(i, highs.length - 1)];
      const lo = lows[Math.min(i, lows.length - 1)] || hi;
      const wind = parseWind(hi.windSpeed);
      return {
        temp: Math.round(hi.temperature),
        low: Math.round(lo.temperature),
        wind,
        precip: hi.probabilityOfPrecipitation?.value ?? 0,
        status: statusFromText(hi.shortForecast, wind),
      };
    });
  }
}
