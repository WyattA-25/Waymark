// Shared e2e helpers. TEST_EMAIL and TEST_PASSWORD come from .env.test.local
// (gitignored), loaded by playwright.config.js.

import { expect } from "@playwright/test";

export const TEST_EMAIL = process.env.TEST_EMAIL;
export const TEST_PASSWORD = process.env.TEST_PASSWORD;

export function requireCreds(test) {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, "TEST_EMAIL / TEST_PASSWORD not set in .env.test.local");
}

// Signs in through the real UI against the real Supabase project and waits
// for the dashboard greeting.
export async function signIn(page) {
  await page.goto("/");
  await page.fill("#waymark-email", TEST_EMAIL);
  await page.fill("#waymark-password", TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByText(/Good (morning|afternoon|evening)/)).toBeVisible({ timeout: 20_000 });
}

// Fetches a real Supabase access token for direct API-route tests.
export async function getAccessToken(request) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`;
  const res = await request.post(url, {
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  if (!res.ok()) throw new Error(`Supabase sign-in failed: ${res.status()}`);
  const body = await res.json();
  return body.access_token;
}
