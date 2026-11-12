// Journey: a diver submits a site, the admin approves it in the moderation
// queue, and the site becomes publicly visible (spec shared/e2e, "An admin
// approves a submitted site").
import { expect, test } from "@playwright/test";
import { admin, login, logout, uniqueEmail } from "./support";

test("an admin approves a submitted site", async ({ page }) => {
  const siteName = `E2E Test Reef ${Date.now()}`;

  // A diver submits a site for review.
  const name = `E2E Submitter ${Date.now()}`;
  await page.goto("/register");
  await page.getByLabel("Display name").fill(name);
  await page.getByLabel("Email").fill(uniqueEmail("submitter"));
  await page.getByLabel("Password").fill("divenet-e2e-pass");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("button", { name: `Account menu: ${name}` })).toBeVisible();

  await page.goto("/sites/new");
  await expect(page.getByRole("heading", { level: 1, name: "Submit a dive site" })).toBeVisible();
  await page.getByLabel("Site name").fill(siteName);
  await page.getByLabel("Latitude").fill("-18.29");
  await page.getByLabel("Longitude").fill("147.70");
  await page.getByLabel("Country").selectOption({ label: "Australia" });
  await page.getByLabel("Region").selectOption({ label: "Great Barrier Reef" });
  await page.getByLabel("Min depth (m)").fill("5");
  await page.getByLabel("Max depth (m)").fill("25");
  await page.getByLabel("Difficulty").selectOption({ label: "2 · Intermediate" });
  await page.getByLabel("Description").fill("A small inshore reef submitted by the E2E suite.");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("Your site has been sent for review.")).toBeVisible();

  // The admin approves it from the moderation queue.
  await logout(page);
  await login(page, admin.email, admin.password, "Admin");
  // The moderation entry lives in the account menu, which opens on click.
  await page.getByRole("button", { name: "Account menu: Admin" }).click();
  await page.getByRole("menuitem", { name: "Moderation" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Moderation" })).toBeVisible();
  const queue = page.getByRole("tabpanel");
  // hasText, not has: an inner locator chained through the same queue again
  // resolves against the page and never matches inside the filtered article.
  const card = queue.getByRole("article").filter({ hasText: siteName });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Approve" }).click();
  await expect(card).toHaveCount(0);

  // The approved site is now public on the map.
  await logout(page);
  await page.goto("/");
  await page.getByLabel("Search sites").fill("E2E Test Reef");
  await page.getByRole("link", { name: siteName }).click();
  await expect(page.getByRole("heading", { level: 1, name: siteName })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reviews" })).toBeVisible();
});
