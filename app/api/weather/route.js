// City coordinates for the PA → Yellowstone route
const ROUTE_CITIES = [
  { city: "Pittsburgh", lat: 40.4406, lon: -79.9959 },
  { city: "Columbus", lat: 39.9612, lon: -82.9988 },
  { city: "St. Louis", lat: 38.6270, lon: -90.1994 },
  { city: "Casper", lat: 42.8501, lon: -106.3252 },
  { city: "Yellowstone", lat: 44.4280, lon: -110.5885 },
];

const WIND_WARNING_THRESHOLD = 35; // mph

export async function GET() {
  try {
    const weatherPromises = ROUTE_CITIES.map(async (stop) => {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", stop.lat);
      url.searchParams.set("longitude", stop.lon);
      url.searchParams.set("current", "temperature_2m,wind_speed_10m,weather_code");
      url.searchParams.set("wind_speed_unit", "mph");
      url.searchParams.set("temperature_unit", "fahrenheit");
      url.searchParams.set("forecast_days", "1");

      const res = await fetch(url.toString());
      const data = await res.json();

      const temp = Math.round(data.current.temperature_2m);
      const wind = Math.round(data.current.wind_speed_10m);
      const code = data.current.weather_code;

      return {
        city: stop.city,
        temp,
        wind,
        status: getStatus(code, wind),
        alert: wind >= WIND_WARNING_THRESHOLD,
      };
    });

    const weatherPoints = await Promise.all(weatherPromises);
    const hasAlert = weatherPoints.some(p => p.alert);
    const alertCity = weatherPoints.find(p => p.alert);

    return Response.json({
      weatherPoints,
      hasAlert,
      alertMessage: alertCity
        ? `High Wind Warning · ${alertCity.city} (${alertCity.wind}mph gusts)`
        : null,
    });

  } catch (err) {
    console.error("Weather error:", err);
    return Response.json(
      { error: "Weather service error", detail: err.message },
      { status: 500 }
    );
  }
}

function getStatus(code, wind) {
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