// Route weather: current conditions at stops along the from/to trip.
import { routeStops } from "../../../lib/geo";
import { getCurrent } from "../../../lib/weatherProviders";
import { rateLimit } from "../../../lib/ratelimit";

const WIND_WARNING_THRESHOLD = 35; // mph

// Strip angle brackets and control characters, trim, and cap length;
// absent input falls back to the default, but input that sanitizes to
// nothing returns null so the caller can reject it
function cleanPlace(value, fallback) {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  const cleaned = raw
    .replace(/[<>\x00-\x1F\x7F]/g, "")
    .trim()
    .slice(0, 80);
  return cleaned || null;
}

export async function GET(req) {
  const limited = rateLimit(req, "weather");
  if (limited) return limited;

  try {
    const { searchParams } = new URL(req.url);
    const from = cleanPlace(searchParams.get("from"), "Pittsburgh");
    const to = cleanPlace(searchParams.get("to"), "Yellowstone National Park");
    if (!from || !to) {
      return Response.json({ error: "Unrecognized location." }, { status: 400 });
    }

    const route = await routeStops(from, to);
    if (route.error) {
      return Response.json(
        { error: `Could not find "${route.error}". Try a city name like "Denver" or "Moab, UT".` },
        { status: 404 }
      );
    }

    const weatherPoints = await Promise.all(
      route.stops.map(async (stop) => {
        const current = await getCurrent(stop.lat, stop.lon);
        return {
          city: stop.city,
          temp: current.temp,
          wind: current.wind,
          status: current.status,
          alert: current.wind >= WIND_WARNING_THRESHOLD,
        };
      })
    );

    const alertCity = weatherPoints.find(p => p.alert);
    return Response.json({
      weatherPoints,
      hasAlert: !!alertCity,
      alertMessage: alertCity
        ? `High Wind Warning · ${alertCity.city} (${alertCity.wind}mph gusts)`
        : null,
    });

  } catch (err) {
    console.error("Weather error:", err);
    return Response.json({ error: "Weather service error" }, { status: 500 });
  }
}
