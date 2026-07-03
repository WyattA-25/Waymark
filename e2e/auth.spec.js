import { test, expect } from "@playwright/test";
import { signIn, requireCreds, TEST_EMAIL } from "./helpers";

test.describe("auth", () => {
  test("signed out: sign-in screen renders, no dashboard content", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#waymark-email")).toBeVisible();
    await expect(page.locator("#waymark-password")).toBeVisible();
    await expect(page.getByText(/Good (morning|afternoon|evening)/)).not.toBeVisible();
  });

  test("empty submit shows inline validation error", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText("Please enter your email and password.")).toBeVisible();
  });

  test("wrong password shows a real Supabase error, form stays usable", async ({ page }) => {
    requireCreds(test);
    await page.goto("/");
    await page.fill("#waymark-email", TEST_EMAIL);
    await page.fill("#waymark-password", "definitely-wrong-password");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText(/Invalid login credentials/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("#waymark-email")).toBeEnabled();
  });

  test("real sign-in reaches the dashboard and the session survives reload", async ({ page }) => {
    requireCreds(test);
    await signIn(page);
    await page.reload();
    await expect(page.getByText(/Good (morning|afternoon|evening)/)).toBeVisible({ timeout: 20_000 });
  });

  test("sign out returns to the sign-in screen", async ({ page }) => {
    requireCreds(test);
    await signIn(page);
    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page.locator("#waymark-email")).toBeVisible({ timeout: 15_000 });
  });
});
