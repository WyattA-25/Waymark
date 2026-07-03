// Multi-day trip forecast: day N of the drive shown at stop N along the route,
// so the outlook reads like the trip itself (leave origin today, arrive later).
import { routeStops } from "../../../lib/geo";
import { getDaily } from "../../../lib/weatherProviders";
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
  const limited = rateLimit(req, "forecast");
  if (limited) return limited;

  try {
    const { searchParams } = new URL(req.url);
    const from = cleanPlace(searchParams.get("from"), "Pittsburgh");
    const to = cleanPlace(searchParams.get("to"), "Yellowstone National Park");
    if (!from || !to) {
      return Response.json({ error: "Unrecognized location." }, { status: 400 });
    }

    const route = await routeStops(from, to, 4); // 6 stops = 6-day outlook
    if (route.error) {
      return Response.json(
        { error: `Could not find "${route.error}". Try a city name like "Denver" or "Moab, UT".` },
        { status: 404 }
      );
    }

    const days = await Promise.all(
      route.stops.map(async (stop, i) => {
        const daily = await getDaily(stop.lat, stop.lon, route.stops.length);
        const d = daily[Math.min(i, daily.length - 1)];
        const alert = d.wind >= WIND_WARNING_THRESHOLD;
        return {
          day: i === 0 ? "Today" : `Day ${i + 1}`,
          city: stop.city,
          temp: d.temp,
          low: d.low,
          wind: d.wind,
          precip: `${d.precip}%`,
          status: alert ? "HIGH WIND WARNING" : d.status,
          alert,
        };
      })
    );

    const alertDay = days.find(d => d.alert);
    return Response.json({
      days,
      hasAlert: !!alertDay,
      alertMessage: alertDay
        ? `${alertDay.wind}mph gusts near ${alertDay.city}. Consider delaying or rerouting.`
        : null,
      alertDay: alertDay?.day || null,
    });

  } catch (err) {
    console.error("Forecast error:", err);
    return Response.json({ error: "Forecast service error" }, { status: 500 });
  }
}
