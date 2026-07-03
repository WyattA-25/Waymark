import { rateLimit } from "../../../lib/ratelimit";
import { fetchJson } from "../../../lib/geo";

const YEAR_RE = /^(19|20)\d{2}$/;

export async function GET(req) {
  const limited = rateLimit(req, "rig-models");
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const rawMake = searchParams.get("make");
  const rawYear = searchParams.get("year");

  if (rawYear !== null) {
    const year = String(rawYear).trim();
    if (!YEAR_RE.test(year)) {
      return Response.json({ error: "year must be a four digit year." }, { status: 400 });
    }
  }

  if (!rawMake || !rawYear) {
    return Response.json({ models: [] });
  }

  const make = rawMake.trim().slice(0, 60);
  const year = String(rawYear).trim();

  try {
    const data = await fetchJson(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`
    );
    const models = (data.Results || []).map(r => r.Model_Name).sort();
    return Response.json({ models });
  } catch (err) {
    console.error("rig-models upstream failed:", err.message);
    return Response.json(
      { error: "Vehicle data service is unavailable right now." },
      { status: 502 }
    );
  }
}
