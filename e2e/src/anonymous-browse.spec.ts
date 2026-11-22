// Journey: an anonymous visitor browses the seeded map and a site's details,
// and switches the UI language (spec shared/e2e, "Anonymous visitor browses a site").
// Nothing here waits on OpenStreetMap tiles (design D5): the result list is the oracle.
import { DEMO_PASSWORD, demoDiver, expect, test, type Page } from "./support";

test("an anonymous visitor browses a seeded site", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Dive-site map" }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expect(page.getByText(/^Sites found: /)).toBeVisible();

  // Search narrows the seeded results to one known site.
  await page.getByLabel("Search sites").fill("Osprey");
  const site = page.getByRole("link", { name: /Osprey Reef/ });
  await expect(site).toBeVisible();
  await site.click();

  // The site's details, reviews and warnings are public.
  await expect(
    page.getByRole("heading", { level: 1, name: "Osprey Reef" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reviews" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Recent warnings" }),
  ).toBeVisible();

  // The UI switches to Ukrainian without a reload or login.
  await page
    .getByRole("group", { name: "Language" })
    .getByRole("button", { name: "UK" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Osprey Reef" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Відгуки" })).toBeVisible();
  // The breadcrumb repeats the nav labels, so scope to the main navigation.
  await expect(
    page
      .getByRole("navigation", { name: "Основна" })
      .getByRole("link", { name: "Мапа" }),
  ).toBeVisible();
});

// Spec shared/disclaimer: a plain context is a first visit (the shared fixture
// would pre-dismiss the dialog).
test("a first visit shows the safety disclaimer until it is dismissed for good", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const disclaimer = page.getByRole("dialog", { name: "Before you dive" });

  await page.goto("/");
  await expect(disclaimer).toBeVisible();
  await expect(disclaimer).toContainText("does not replace dive planning");
  await page.keyboard.press("Escape");
  await expect(disclaimer).toBeHidden();
  await expect(page.getByRole("main")).toBeFocused();

  // Closed without "Don't show again": the next load shows it again.
  await page.reload();
  await expect(disclaimer).toBeVisible();
  await disclaimer.getByRole("checkbox", { name: "Don't show again" }).check();
  await disclaimer.getByRole("button", { name: "Got it" }).click();
  await expect(disclaimer).toBeHidden();

  await page.reload();
  await expect(page.getByText(/^Sites found: /)).toBeVisible();
  await expect(disclaimer).toBeHidden();
  await context.close();
});

/** The document's scroll height and the viewport's height. */
const heights = (page: Page) =>
  page.evaluate(() => [
    document.documentElement.scrollHeight,
    window.innerHeight,
  ]);

// Spec site/map "The map fills the viewport below the header" and site/search
// "The result count stays in view", with the seeded sites.
test("the map page fills the viewport and never scrolls", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const results = page.getByRole("region", { name: "Results" });
  await expect(results.getByRole("link").first()).toBeVisible();
  const [scroll, viewport] = await heights(page);
  expect(scroll).toBe(viewport);
  const map = await page
    .getByRole("region", { name: "Map of dive sites" })
    .boundingBox();
  expect(Math.round(map!.y + map!.height)).toBe(viewport);

  // The list scrolls inside the panel; the count stays where it was.
  const count = page.getByRole("heading", { name: /^Sites found: / });
  const before = await count.boundingBox();
  await results.getByRole("link").last().scrollIntoViewIfNeeded();
  const after = await count.boundingBox();
  expect(after!.y).toBe(before!.y);
  await expect(count).toBeInViewport();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Show all" })).toBeVisible();
  expect(await heights(page)).toEqual([844, 844]);
  await page.getByRole("button", { name: "Show all" }).click();
  expect(await heights(page)).toEqual([844, 844]);
});

// Spec site/search "Phones show filters in a dialog and results in a sheet", scenario
// "Drawer covers the map controls" (F-20): the floating search box stays under the drawer.
test("the open menu covers the phone map controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const searchBox = page.getByRole("searchbox", { name: "Search sites" });
  await expect(searchBox).toBeVisible();
  const box = (await searchBox.boundingBox())!;

  await page.getByRole("button", { name: "Open menu" }).click();
  const drawer = page.getByRole("dialog", { name: "Menu" });
  await expect(drawer).toBeVisible();
  // Measure the panel where it comes to rest, not partway through its slide-in.
  await drawer.evaluate((panel) =>
    Promise.all(
      panel.getAnimations().map((a) => a.finished.catch(() => undefined)),
    ),
  );
  const drawerBox = (await drawer.boundingBox())!;
  // A point of the search box that the drawer's panel overlaps.
  const x = Math.min(box.x + box.width / 2, drawerBox.x + drawerBox.width - 10);
  const y = box.y + box.height / 2;
  const onTop = await page.evaluate(
    ([px, py]) =>
      Boolean(document.elementFromPoint(px, py)?.closest('[role="dialog"]')),
    [x, y],
  );
  expect(onTop).toBe(true);
});

// Spec auth "Diver actions ask a visitor to log in" and "Logging in from the
// dialog returns to the action", with a seeded diver who has no review there.
test("a visitor's Write a review asks to log in, then opens the form", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Search sites").fill("Osprey");
  await page.getByRole("link", { name: /Osprey Reef/ }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Osprey Reef" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Write a review" }).click();
  const prompt = page.getByRole("dialog", { name: "Log in to continue" });
  await expect(prompt).toBeVisible();
  await expect(prompt).toContainText("Log in to write a review.");
  await expect(
    page.getByRole("heading", { level: 1, name: "Osprey Reef" }),
  ).toBeVisible();

  await prompt.getByRole("button", { name: "Log in" }).click();
  await page.getByLabel("Email").fill(demoDiver.aiko);
  await page.getByLabel("Password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Write a review" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/sites\/\d+\/review$/);
});

// Spec media/photo-viewer: a seeded review photo opens in the overlay viewer.
test("a review photo opens in the viewer and closes on Escape", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Search sites").fill("Thistlegorm");
  await page.getByRole("link", { name: /SS Thistlegorm/ }).click();
  const thumbnail = page.getByRole("img", { name: /^Photo 1 by / });
  await thumbnail.click();

  const viewer = page.getByRole("dialog", { name: "Photo viewer" });
  await expect(viewer).toBeVisible();
  await expect(
    viewer.getByRole("button", { name: "Next photo" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(viewer).toBeHidden();
  await expect(
    page.getByRole("heading", { level: 1, name: "SS Thistlegorm" }),
  ).toBeVisible();
});
