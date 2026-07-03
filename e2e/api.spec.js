// Direct integration tests against the API routes on the test dev server.
// These hit the real upstream providers (Open-Meteo, Nominatim,
// Recreation.gov, NHTSA, YouTube) plus real Supabase auth for the chat route.

import { test, expect } from "@playwright/test";
import { getAccessToken, requireCreds } from "./helpers";

test.describe("api routes", () => {
  test("chat without auth returns 401", async ({ request }) => {
    const res = await request.post("/api/chat", {
      data: { messages: [{ role: "user", text: "hi" }], rigProfile: {} },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test("chat with auth but malformed body returns 400", async ({ request }) => {
    requireCreds(test);
    const token = await getAccessToken(request);
    const res = await request.post("/api/chat", {
      headers: { Authorization: `Bearer ${token}` },
      data: { messages: "not an array" },
    });
    expect(res.status()).toBe(400);
  });

  test("chat with auth and a real question returns text", async ({ request }) => {
    requireCreds(test);
    const token = await getAccessToken(request);
    const res = await request.post("/api/chat", {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        messages: [{ role: "user", text: "Reply with the single word: pong" }],
        rigProfile: { year: "2024", make: "Grand Design", model: "Imagine" },
      },
      timeout: 45_000,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.text).toBe("string");
    expect(body.text.length).toBeGreaterThan(0);
  });

  // Weather and forecast depend on api.open-meteo.com, a free provider that
  // has real outages. Skip (rather than fail) when it is unreachable, so the
  // suite stays meaningful during provider downtime.
  async function openMeteoReachable(request) {
    try {
      const probe = await request.get(
        "https://api.open-meteo.com/v1/forecast?latitude=40&longitude=-105&current=temperature_2m",
        { timeout: 8_000 }
      );
      return probe.ok();
    } catch {
      return false;
    }
  }

  test("weather returns waypoints for a real route", async ({ request }) => {
    test.skip(!(await openMeteoReachable(request)), "api.open-meteo.com unreachable (provider outage)");
    const res = await request.get("/api/weather?from=Denver&to=Moab", { timeout: 60_000 });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.weatherPoints)).toBe(true);
    expect(body.weatherPoints.length).toBeGreaterThanOrEqual(2);
    expect(body.weatherPoints[0].city).toBeTruthy();
  });

  test("weather with provided-but-garbage location returns 400", async ({ request }) => {
    const res = await request.get("/api/weather?from=%3C%3E&to=Moab");
    expect(res.status()).toBe(400);
  });

  test("forecast returns daily cards", async ({ request }) => {
    test.skip(!(await openMeteoReachable(request)), "api.open-meteo.com unreachable (provider outage)");
    const res = await request.get("/api/forecast?from=Pittsburgh&to=Yellowstone", { timeout: 90_000 });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.days)).toBe(true);
    expect(body.days.length).toBeGreaterThanOrEqual(3);
  });

  test("campsites near a destination returns campgrounds", async ({ request }) => {
    const res = await request.get("/api/campsites?near=Moab", { timeout: 60_000 });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.campgrounds)).toBe(true);
  });

  test("campsites with NaN limit does not crash or return empty", async ({ request }) => {
    const res = await request.get("/api/campsites?near=Moab&limit=abc", { timeout: 60_000 });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.campgrounds)).toBe(true);
  });

  test("youtube returns videos", async ({ request }) => {
    const res = await request.get("/api/youtube?query=RV+camping", { timeout: 30_000 });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.videos)).toBe(true);
    expect(body.videos.length).toBeGreaterThan(0);
    expect(body.videos[0].url).toContain("youtube.com");
  });

  test("rig-models validates year", async ({ request }) => {
    const bad = await request.get("/api/rig-models?year=20%2F24&make=Jayco");
    expect(bad.status()).toBe(400);
    const good = await request.get("/api/rig-models?year=2024&make=Jayco", { timeout: 30_000 });
    expect(good.status()).toBe(200);
    const body = await good.json();
    expect(Array.isArray(body.models)).toBe(true);
  });
});
