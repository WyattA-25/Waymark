// Offline (WebLLM) checks. The fallback tests run in both Chromium and
// Firefox (navigator.gpu removed deterministically, since some Firefox
// builds now ship WebGPU). The full download-and-answer acceptance test is
// heavy (~700MB) and only runs when RUN_WEBLLM_E2E=1.

import { test, expect } from "@playwright/test";
import { signIn, requireCreds } from "./helpers";

test.describe("offline mode", () => {
  test("fallback: no WebGPU shows the notice and disables the Offline toggle", async ({ page }) => {
    requireCreds(test);
    await page.addInitScript(() => {
      try { delete Navigator.prototype.gpu; } catch {}
      try { Object.defineProperty(navigator, "gpu", { get: () => undefined }); } catch {}
    });
    await signIn(page);
    await page.getByRole("button", { name: "Co-Pilot" }).click();
    await expect(page.getByText(/Offline AI unavailable: this browser has no WebGPU/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Offline" })).toBeDisabled();
  });

  test("fallback: sending with no WebGPU and cloud blocked gives guidance, not a crash", async ({ page }) => {
    requireCreds(test);
    await page.addInitScript(() => {
      try { delete Navigator.prototype.gpu; } catch {}
      try { Object.defineProperty(navigator, "gpu", { get: () => undefined }); } catch {}
    });
    await signIn(page);
    await page.getByRole("button", { name: "Co-Pilot" }).click();
    await page.route("**/api/chat", route => route.abort());
    const input = page.getByLabel("Message Waymark AI");
    await input.fill("emergency question");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText(/needs WebGPU|no WebGPU/).first()).toBeVisible({ timeout: 20_000 });
  });

  test("ACCEPTANCE GATE: model downloads, then answers with the network disabled", async ({ page, context }) => {
    test.skip(process.env.RUN_WEBLLM_E2E !== "1", "set RUN_WEBLLM_E2E=1 to run the ~700MB model download test");
    test.setTimeout(1_800_000);
    requireCreds(test);
    await signIn(page);
    await page.getByRole("button", { name: "Co-Pilot" }).click();

    // WebLLM needs WebGPU, which is often unavailable under automated
    // Chromium (Playwright's headless shell has no WebGPU, and full/headed
    // Chromium does not expose navigator.gpu under automation on many
    // Windows setups). Skip rather than hang for 30 minutes; the same path
    // is verified manually per docs/TESTING.md.
    const hasWebGPU = await page.evaluate(async () => {
      if (!navigator.gpu) return false;
      try { return !!(await navigator.gpu.requestAdapter()); } catch { return false; }
    });
    test.skip(!hasWebGPU, "WebGPU unavailable in this automated browser; verify offline mode manually (see docs/TESTING.md)");

    await page.getByText("Download offline AI for emergency use").click();
    await expect(page.getByText("Offline AI ready: answers even with no internet")).toBeVisible({ timeout: 1_500_000 });

    await context.setOffline(true);
    await page.getByRole("button", { name: "Offline" }).click();
    const input = page.getByLabel("Message Waymark AI");
    await input.fill("I smell propane in the camper, what do I do?");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("OFFLINE AI").first()).toBeVisible({ timeout: 300_000 });
  });
});
