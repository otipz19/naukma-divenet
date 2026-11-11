// Playwright configuration for the DiveNet E2E journeys (spec shared/e2e).
// The base URL points at the compose stack started by scripts/run-e2e.mjs
// (compose project divenet-e2e, web port 18081); DIVENET_E2E_BASE_URL lets a
// developer point the suite at a stack they started themselves.
import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.DIVENET_E2E_PORT ?? "18081";
const baseURL = process.env.DIVENET_E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./src",
  fullyParallel: false, // journeys share one stack and build on each other's data
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
