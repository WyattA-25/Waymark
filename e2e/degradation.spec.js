// Graceful-degradation checks: killing any single upstream API must not
// blank or crash the page (Phase 6 acceptance).

import { test, expect } from "@playwright/test";
import { signIn, requireCreds } from "./helpers";

test.describe("graceful degradation", () => {
  test("weather API down: dashboard still renders with an error notice", async ({ page }) => {
    requireCreds(test);
    await page.route("**/api/weather*", route => route.abort());
    await signIn(page);
    await expect(page.getByText(/Good (morning|afternoon|evening)/)).toBeVisible();
    await expect(page.getByText("Route Weather")).toBeVisible();
    await expect(page.getByText(/Weather is unavailable right now/)).toBeVisible({ timeout: 15_000 });
  });

  test("youtube API down: dashboard vibe feed shows a fallback, page intact", async ({ page }) => {
    requireCreds(test);
    await page.route("**/api/youtube*", route => route.abort());
    await signIn(page);
    await expect(page.getByText(/Videos are unavailable right now/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Good (morning|afternoon|evening)/)).toBeVisible();
  });

  test("campsites API down: Explore shows a friendly error, no blank page", async ({ page }) => {
    requireCreds(test);
    await page.route("**/api/campsites*", route => route.abort());
    await signIn(page);
    await page.getByRole("button", { name: "Explore" }).click();
    await expect(page.getByText(/Could not load campgrounds/i)).toBeVisible({ timeout: 15_000 });
  });

  test("forecast API down: Full Forecast shows a friendly error", async ({ page }) => {
    requireCreds(test);
    await page.route("**/api/forecast*", route => route.abort());
    await signIn(page);
    await page.getByRole("button", { name: /Full Forecast/ }).click();
    await expect(page.getByText(/Forecast is unavailable right now/)).toBeVisible({ timeout: 15_000 });
  });
});
