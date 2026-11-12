// Journey: a brand-new user registers, opens a seeded site and publishes a
// review with a photo (spec shared/e2e, "A new user registers, logs in and
// reviews a site").
import { expect, test, type Page } from "@playwright/test";
import { uniqueEmail } from "./support";

/** The number of ratings in the site facts, from the rating image's accessible
 * label ("Rated 4.6 out of 5, 12 ratings"). */
async function siteRatingCount(page: Page): Promise<number> {
  const label =
    (await page
      .getByRole("group", { name: "Site facts" })
      .getByRole("img", { name: /out of 5/ })
      .getAttribute("aria-label")) ?? "";
  return Number(label.match(/(\d+) ratings?/)?.[1] ?? 0);
}

test("a new user registers and reviews a seeded site with a photo", async ({ page }) => {
  const name = `E2E Reviewer ${Date.now()}`;
  const email = uniqueEmail("reviewer");
  const reviewText = "E2E: calm, clear water and a friendly turtle at the cleaning station.";

  // Register, and land signed in.
  await page.goto("/register");
  await page.getByLabel("Display name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("divenet-e2e-pass");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("button", { name: `Account menu: ${name}` })).toBeVisible();

  // Open a seeded site and note its rating count.
  await page.goto("/");
  await page.getByLabel("Search sites").fill("Osprey");
  await page.getByRole("link", { name: /Osprey Reef/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Osprey Reef" })).toBeVisible();
  const ratingBefore = await siteRatingCount(page);

  // Write a review with a photo.
  await page.getByRole("link", { name: "Write a review" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Write a review" })).toBeVisible();
  await page.getByLabel("5 stars").check();
  await page.getByLabel("Review", { exact: true }).fill(reviewText);
  await page.getByRole("button", { name: "Add photo" }).click();
  // The Videos field owns a second hidden file input, so scope to the Photos group.
  await page
    .getByRole("group", { name: "Photos" })
    .locator("input[type=file]")
    .setInputFiles("fixtures/photo.jpg");
  await expect(page.getByRole("img", { name: "Photo 1" })).toBeVisible();
  await page.getByRole("button", { name: "Publish review" }).click();

  // The review, its photo and the new rating are on the site page.
  await expect(page.getByRole("heading", { level: 1, name: "Osprey Reef" })).toBeVisible();
  await expect(page.getByText(reviewText)).toBeVisible();
  await expect(page.getByRole("img", { name: `Photo 1 by ${name}` })).toBeVisible();
  // The rating count in the site facts grew by this review.
  expect(await siteRatingCount(page)).toBeGreaterThan(ratingBefore);
});
