// Lightweight in-memory rate limiter, per IP per bucket. Good enough to keep
// a public deployment from burning API quotas; resets on cold start.

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const LIMITS = {
  chat: 30,
  weather: 60,
  forecast: 60,
  campsites: 60,
  youtube: 60,
  "rig-models": 60,
};

const hits = new Map(); // "bucket:ip" -> { count, reset }

// Returns a 429 Response when over the limit, otherwise null.
export function rateLimit(req, bucket, key = null) {
  const ip = key
    || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "local";
  const mapKey = `${bucket}:${ip}`;
  const now = Date.now();

  // Opportunistic cleanup so the map cannot grow without bound
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  }

  const entry = hits.get(mapKey);
  if (!entry || entry.reset < now) {
    hits.set(mapKey, { count: 1, reset: now + WINDOW_MS });
    return null;
  }
  entry.count += 1;
  if (entry.count > (LIMITS[bucket] || 60)) {
    return Response.json(
      { error: "Too many requests. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }
  return null;
}
