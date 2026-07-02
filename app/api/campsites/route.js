import { rateLimit } from "../../../lib/ratelimit";
import { geocode } from "../../../lib/geo";

export async function GET(req) {
  const limited = rateLimit(req, "campsites");
  if (limited) return limited;

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "camping";
    const state = searchParams.get("state"); // optional two-letter filter
    const near = searchParams.get("near"); // optional place name for radius search
    const limit = Math.min(parseInt(searchParams.get("limit") || "6"), 20);

    // Search Recreation.gov for campgrounds
    const url = new URL("https://ridb.recreation.gov/api/v1/facilities");
    url.searchParams.set("activity", "CAMPING");
    if (near) {
      // Radius search around a geocoded place beats fuzzy text matching
      const place = await geocode(near);
      if (!place) {
        return Response.json({ error: `Could not find "${near}".` }, { status: 404 });
      }
      url.searchParams.set("latitude", place.lat);
      url.searchParams.set("longitude", place.lon);
      url.searchParams.set("radius", "100");
    } else {
      url.searchParams.set("query", query);
      if (state) url.searchParams.set("state", state);
    }
    url.searchParams.set("limit", "20");
    url.searchParams.set("offset", "0");

    const res = await fetch(url.toString(), {
      headers: {
        "apikey": process.env.RECREATION_GOV_API_KEY,
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Recreation.gov error:", res.status, text);
      return Response.json(
        { error: "Recreation.gov API error", detail: text },
        { status: 500 }
      );
    }

    const data = await res.json();

    const campgrounds = (data.RECDATA || [])
      .slice(0, limit)
      .map(c => ({
        id: c.FacilityID,
        name: c.FacilityName,
        description: c.FacilityDescription?.replace(/<[^>]*>/g, "").slice(0, 120) || "No description available.",
        state: c.AddressStateCode,
        latitude: c.FacilityLatitude,
        longitude: c.FacilityLongitude,
        phone: c.FacilityPhone,
        url: `https://www.recreation.gov/camping/campgrounds/${c.FacilityID}`,
        reservable: c.Reservable,
      }));

    return Response.json({ campgrounds });

  } catch (err) {
    console.error("Campsites route error:", err);
    return Response.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
