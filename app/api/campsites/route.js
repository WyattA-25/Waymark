import { rateLimit } from "../../../lib/ratelimit";
import { geocode, fetchJson } from "../../../lib/geo";

export async function GET(req) {
  const limited = rateLimit(req, "campsites");
  if (limited) return limited;

  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("query") || "").trim().slice(0, 80) || "camping";
    const rawState = (searchParams.get("state") || "").trim();
    const state = /^[a-z]{2}$/i.test(rawState) ? rawState : null; // optional two-letter filter, ignored if malformed
    const near = (searchParams.get("near") || "").trim().slice(0, 80) || null; // optional place name for radius search
    const parsed = parseInt(searchParams.get("limit") || "6");
    const limit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 20) : 6;

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

    let data;
    try {
      data = await fetchJson(url.toString(), {
        headers: {
          "apikey": process.env.RECREATION_GOV_API_KEY,
          "Accept": "application/json",
        },
      });
    } catch (err) {
      console.error("Recreation.gov error:", err.status || "", err.message);
      return Response.json(
        { error: "Campground search is unavailable right now." },
        { status: 502 }
      );
    }

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
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
