import { test, expect } from "@playwright/test";
import { signIn, requireCreds } from "./helpers";

test.describe("cloud chat", () => {
  test("real question returns a real Gemini answer", async ({ page }) => {
    requireCreds(test);
    await signIn(page);
    await page.getByRole("button", { name: "Co-Pilot" }).click();
    const input = page.getByLabel("Message Waymark AI");
    await input.fill("In one short sentence, how long is my trailer?");
    const responsePromise = page.waitForResponse(
      r => r.url().includes("/api/chat") && r.request().method() === "POST",
      { timeout: 45_000 }
    );
    await page.getByRole("button", { name: "Send message" }).click();

    // The user bubble appears immediately; the AI reply follows.
    await expect(page.getByText("In one short sentence, how long is my trailer?")).toBeVisible();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.text).toBe("string");
    expect(body.text.length).toBeGreaterThan(0);
    // And the answer text actually renders in a chat bubble (markdown
    // markers are stripped by the renderer, so strip them here too).
    const clean = body.text.replace(/[*#`]/g, "").trim();
    const snippet = clean.split(/\s+/).slice(0, 4).join(" ");
    await expect(page.getByText(snippet, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
  });

  test("blocked /api/chat in Cloud mode shows the friendly unreachable message", async ({ page }) => {
    requireCreds(test);
    await signIn(page);
    await page.getByRole("button", { name: "Co-Pilot" }).click();
    await page.getByRole("button", { name: "Cloud" }).click();
    await page.route("**/api/chat", route => route.abort());
    const input = page.getByLabel("Message Waymark AI");
    await input.fill("test question");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText(/Cloud AI is unreachable right now/)).toBeVisible({ timeout: 20_000 });
  });

  test("chat history survives switching tabs", async ({ page }) => {
    requireCreds(test);
    await signIn(page);
    await page.getByRole("button", { name: "Co-Pilot" }).click();
    await page.getByRole("button", { name: "Cloud" }).click();
    await page.route("**/api/chat", route => route.abort());
    const input = page.getByLabel("Message Waymark AI");
    await input.fill("remember me across tabs");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("remember me across tabs")).toBeVisible();

    await page.getByRole("button", { name: "Home" }).click();
    await expect(page.getByText(/Good (morning|afternoon|evening)/)).toBeVisible();
    await page.getByRole("button", { name: "Co-Pilot" }).click();
    await expect(page.getByText("remember me across tabs")).toBeVisible();
  });
});
