// Playwright e2e config. Tests run against a dedicated dev server on port 3011
// so they never clash with a dev server already running on 3000/3010.
// Credentials come from .env.test.local (gitignored); Supabase URL and anon key
// are read from .env.local so they are never duplicated.

import { defineConfig, devices } from "@playwright/test";
import fs from "fs";
import path from "path";

function loadEnvFile(name) {
  const file = path.join(process.cwd(), name);
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}
loadEnvFile(".env.local");
loadEnvFile(".env.test.local");

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3011",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- -p 3011",
    url: "http://localhost:3011",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Cross-browser fallback check in a second engine. Opt-in via
    // E2E_FIREFOX=1: Playwright's Firefox build needs the Microsoft VC++
    // redistributable, which not every Windows machine has. The same
    // fallback path is always covered in Chromium with navigator.gpu
    // removed (offline.spec.js).
    ...(process.env.E2E_FIREFOX === "1" ? [{
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testMatch: /offline\.spec\.js/,
      grep: /fallback/,
    }] : []),
  ],
});
