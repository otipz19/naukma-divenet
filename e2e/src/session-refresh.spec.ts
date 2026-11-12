// Journey: a login session survives losing the in-memory access token
// (spec shared/e2e, "A login session survives token refresh"). A full page
// reload drops the token, so the next authenticated request must silently
// refresh through the HttpOnly refresh cookie (design D3): the same code path
// as a real 15-minute expiry, in seconds.
import { expect, test } from "@playwright/test";
import { DEMO_PASSWORD, demoDiver, login } from "./support";

test("a session survives an expired access token", async ({ page }) => {
  const name = "Marco Rossi";
  await login(page, demoDiver.marco, DEMO_PASSWORD, name);

  // The reload loses the access token; the refresh cookie must restore the session.
  await page.goto("/dive-log");
  await expect(page.getByRole("heading", { level: 1, name: "Dive log" })).toBeVisible();
  await page.reload();

  // Still signed in: the authenticated page loads, and the login page never appears.
  await expect(page.getByRole("heading", { level: 1, name: "Dive log" })).toBeVisible();
  await expect(page.getByRole("button", { name: `Account menu: ${name}` })).toBeVisible();
  await expect(page).not.toHaveURL(/\/login/);
});
