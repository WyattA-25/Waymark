// Pro tier: free accounts see the upsell, not the features, and the
// entitlement cannot be self-granted from the client.

import { test, expect } from "@playwright/test";
import { signIn, requireCreds, getAccessToken } from "./helpers";

test.describe("pro tier", () => {
  test("free account sees the Pro upsell instead of the maintenance log", async ({ page }) => {
    requireCreds(test);
    await signIn(page);
    await page.getByRole("button", { name: "Rig" }).click();
    await expect(page.getByText("Maintenance log")).toBeVisible();
    await expect(page.getByText("Payments coming soon")).toBeVisible();
    await expect(page.getByText("No maintenance items yet")).not.toBeVisible();
  });

  test("client cannot self-upgrade the plan (RLS: no insert/update policies)", async ({ request }) => {
    requireCreds(test);
    const token = await getAccessToken(request);
    const res = await request.post(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/subscriptions`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        data: { plan: "pro", status: "active" },
      }
    );
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("free account still gets normal cloud chat", async ({ request }) => {
    requireCreds(test);
    const token = await getAccessToken(request);
    const res = await request.post("/api/chat", {
      headers: { Authorization: `Bearer ${token}` },
      data: { messages: [{ role: "user", text: "Reply with one word: ok" }], rigProfile: {} },
      timeout: 45_000,
    });
    expect(res.status()).toBe(200);
  });
});
