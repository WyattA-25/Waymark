export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "camping";
    const state = searchParams.get("state") || "PA";
    const rigLength = parseInt(searchParams.get("rigLength") || "30");

    // Search Recreation.gov for campgrounds
    const url = new URL("https://ridb.recreation.gov/api/v1/facilities");
    url.searchParams.set("activity", "CAMPING");
    url.searchParams.set("query", query);
    url.searchParams.set("state", state);
    url.searchParams.set("limit", "20");
    url.searchParams.set("offset", "0");

    const res = await fetch(url.toString(), {
      headers: {
        "apikey": process.env.RECREATION_GOV_API_KEY,
        "Accept": "application/json",
      }
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Recreation.gov error:", res.status, text);
      return Response.json(
        { error: "Recreation.gov API error", detail: text },
        { status: 500 }
      );
    }

    const text = await res.text();
    console.log("Raw response preview:", text.slice(0, 200));
    const data = JSON.parse(text);

    // Filter and format results
    const campgrounds = (data.RECDATA || [])
      .slice(0, 6)
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