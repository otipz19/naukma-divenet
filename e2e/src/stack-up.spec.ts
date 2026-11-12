// The stack is up and serves the app (used to verify scripts/run-e2e.mjs).
import { expect, test } from "@playwright/test";

test("the app loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
});
