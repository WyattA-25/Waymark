export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const make = searchParams.get("make");
  const year = searchParams.get("year");

  if (!make || !year) {
    return Response.json({ models: [] });
  }

  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`
    );
    const data = await res.json();
    const models = (data.Results || []).map(r => r.Model_Name).sort();
    return Response.json({ models });
  } catch (err) {
    return Response.json({ models: [], error: err.message });
  }
}