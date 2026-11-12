// Journey: an anonymous visitor browses the seeded map and a site's details,
// and switches the UI language (spec shared/e2e, "Anonymous visitor browses a site").
// Nothing here waits on OpenStreetMap tiles (design D5): the result list is the oracle.
import { expect, test } from "@playwright/test";

test("an anonymous visitor browses a seeded site", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Dive-site map" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expect(page.getByText(/^Sites found: /)).toBeVisible();

  // Search narrows the seeded results to one known site.
  await page.getByLabel("Search sites").fill("Osprey");
  const site = page.getByRole("link", { name: /Osprey Reef/ });
  await expect(site).toBeVisible();
  await site.click();

  // The site's details, reviews and warnings are public.
  await expect(page.getByRole("heading", { level: 1, name: "Osprey Reef" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reviews" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent warnings" })).toBeVisible();

  // The UI switches to Ukrainian without a reload or login.
  await page.getByRole("group", { name: "Language" }).getByRole("button", { name: "UK" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Osprey Reef" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Відгуки" })).toBeVisible();
  // The breadcrumb repeats the nav labels, so scope to the main navigation.
  await expect(
    page.getByRole("navigation", { name: "Основна" }).getByRole("link", { name: "Мапа" }),
  ).toBeVisible();
});
