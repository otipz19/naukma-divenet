// The accessibility audits (spec shared/accessibility): every routed page is
// scanned against WCAG 2.1 A/AA in its rendered, data-carrying state. Pages are
// reached through the same flows the journeys use. Both color themes come from
// the system preference by default (frontend/src/app/theme.ts), so dark-theme
// scans run in a colorScheme: "dark" context, and the theme switch can pin a
// theme; the uk locale is scanned on pages whose chrome translates.
import {
  admin,
  DEMO_PASSWORD,
  demoDiver,
  dismissDisclaimer,
  expect,
  login,
  test,
} from "./support";
import { expectAccessible } from "./support/audit";

// A seeded site with reviews and warnings, used by the perf suite too.
const SITE = "/sites/1";

test("anonymous pages are accessible", async ({ page }) => {
  await page.goto("/");
  // The map's tiles are the one external subresource (OSM, over HTTPS); the CSP
  // must let them through — a blocked tile shows as an empty map with the
  // journeys otherwise green.
  await page.waitForSelector(".leaflet-tile-loaded", { timeout: 15000 });
  await expectAccessible(page, "map");

  await page.goto("/sites");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectAccessible(page, "site catalog");

  await page.goto(SITE);
  await expect(page.getByRole("heading", { name: "Reviews" })).toBeVisible();
  await expectAccessible(page, "site details");

  // A visitor's diver action opens the log-in prompt (spec auth).
  await page.getByRole("link", { name: "Write a review" }).click();
  await expect(page.getByRole("dialog", { name: "Log in to continue" })).toBeVisible();
  await expectAccessible(page, "log-in prompt dialog");

  // A review photo opens the overlay viewer (spec media/photo-viewer).
  await page.goto("/");
  await page.getByLabel("Search sites").fill("Thistlegorm");
  await page.getByRole("link", { name: /SS Thistlegorm/ }).click();
  await page.getByRole("img", { name: /^Photo 1 by / }).click();
  await expect(page.getByRole("dialog", { name: "Photo viewer" })).toBeVisible();
  await expectAccessible(page, "photo viewer");

  await page.goto("/login");
  await expectAccessible(page, "login");

  await page.goto("/register");
  await expectAccessible(page, "register");
});

// The theme contract has two activation paths, and the audit checks both
// against the live stylesheet:
// 1. the OS preference: the stylesheet's @media (prefers-color-scheme) block
//    applies whenever the attribute does not pin the other theme, so the page
//    is dark before (or without) any JavaScript;
// 2. the explicit attribute: frontend/src/app/theme.ts mirrors the OS
//    preference into <html data-theme> live (theme choice "system"), and an
//    attribute pinning light beats an OS dark setting through the media
//    block's :not() negation.
test("the theme respects both the system preference and the attribute", async ({ page }) => {
  await page.goto("/");
  const theme = () => page.locator("html").getAttribute("data-theme");

  // The attribute mirrors the OS preference and follows its changes (JS path).
  // The change event reaches the watcher asynchronously, so wait for the
  // attribute instead of reading it right after the emulation.
  expect(await theme()).toBe("light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect
    .poll(() => page.locator("html").getAttribute("data-theme"))
    .toBe("dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect
    .poll(() => page.locator("html").getAttribute("data-theme"))
    .toBe("light");

  // The stylesheet's media path holds without the attribute (the no-JS case):
  // attribute removed, OS dark -> dark token, read synchronously so the
  // watcher cannot re-set the attribute before the check.
  await page.emulateMedia({ colorScheme: "dark" });
  expect(await page.evaluate(() => {
    document.documentElement.removeAttribute("data-theme");
    return getComputedStyle(document.documentElement).getPropertyValue("--surface-0").trim();
  })).toBe("#0a1520");

  // The explicit attribute beats the OS setting: pinned light while OS is dark
  // stays light (the media block's :not() negation).
  expect(await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "light");
    return getComputedStyle(document.documentElement).getPropertyValue("--surface-0").trim();
  })).toBe("#f5f8f9");

  // Native UI follows the active theme: the stylesheet declares color-scheme on
  // the same paths as the tokens, so scrollbars and form controls match.
  const scheme = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("color-scheme").trim());
  expect(await scheme()).toBe("light"); // attribute pinned light, OS dark
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  expect(await scheme()).toBe("dark");
  await page.evaluate(() => document.documentElement.removeAttribute("data-theme"));
  expect(await scheme()).toBe("dark"); // media path, OS still dark
});

// The theme switch pins a theme over the OS preference and keeps it across a
// reload (spec shared/app-shell: The header has a theme switch).
test("the theme switch pins a theme across a reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const dark = page
    .getByRole("banner")
    .getByRole("group", { name: "Colour theme" })
    .getByRole("button", { name: "Dark theme" });

  await dark.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(dark).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(dark).toHaveAttribute("aria-pressed", "true");
  await expectAccessible(page, "map (dark, pinned)");
});

test("anonymous pages are accessible in the dark theme", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  await dismissDisclaimer(context);
  const page = await context.newPage();
  await page.goto("/");
  await expectAccessible(page, "map (dark)");
  await page.goto(SITE);
  await expectAccessible(page, "site details (dark)");
  await context.close();
});

test("anonymous pages are accessible in the uk locale", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("group", { name: "Language" })
    .getByRole("button", { name: "UK" })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectAccessible(page, "map (uk)");
  await page.goto("/login");
  await expectAccessible(page, "login (uk)");
});

test("a diver's pages are accessible", async ({ page }) => {
  await login(page, demoDiver.sofia, DEMO_PASSWORD, "Sofia Alvarez");

  await page.goto("/dive-log");
  await expect(page.getByRole("region", { name: "Logged dives" })).toBeVisible();
  await expectAccessible(page, "dive log");
  // The entry form lives in a dialog: scan the page with it open.
  await page.getByRole("button", { name: "Log a dive" }).click();
  await expect(page.getByRole("dialog", { name: "Log a dive" })).toBeVisible();
  await expectAccessible(page, "dive log entry dialog");
  await page.keyboard.press("Escape");

  await page.goto("/feed");
  await expectAccessible(page, "feed");

  await page.goto("/posts/new");
  await expectAccessible(page, "post editor");

  await page.goto("/sites/new");
  await expectAccessible(page, "site submission");

  // The profile is reached through the account menu, which links by numeric id.
  await page.getByRole("button", { name: "Account menu: Sofia Alvarez" }).click();
  await page.getByRole("menuitem", { name: "Your profile" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectAccessible(page, "profile");
});

test("review and warning forms are accessible", async ({ page }) => {
  await login(page, demoDiver.marco, DEMO_PASSWORD, "Marco Rossi");

  await page.goto(`${SITE}/review`);
  await expectAccessible(page, "review form");

  await page.goto(`${SITE}/warnings/new`);
  await expectAccessible(page, "warning form");
});

test("the certificates page is accessible", async ({ page }) => {
  await login(page, demoDiver.bohdan, DEMO_PASSWORD, "Богдан Лиманець");
  await page.goto("/profile/certificates");
  await expect(page.getByRole("region", { name: "Certificates" })).toBeVisible();
  await expectAccessible(page, "certificates");
  await page.getByRole("button", { name: "Add a certificate" }).click();
  await expect(page.getByRole("dialog", { name: "Add a certificate" })).toBeVisible();
  await expectAccessible(page, "certificate dialog");
});

test("the certificate dialog is accessible in the dark theme", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  await dismissDisclaimer(context);
  const page = await context.newPage();
  await login(page, demoDiver.bohdan, DEMO_PASSWORD, "Богдан Лиманець");
  await page.goto("/profile/certificates");
  await page.getByRole("button", { name: "Add a certificate" }).click();
  await expect(page.getByRole("dialog", { name: "Add a certificate" })).toBeVisible();
  await expectAccessible(page, "certificate dialog (dark)");
  await context.close();
});

test("the admin moderation page is accessible", async ({ page }) => {
  await login(page, admin.email, admin.password, "Admin");
  await page.goto("/admin/moderation");
  await expectAccessible(page, "admin moderation");
});

// Spec shared/accessibility "The disclaimer dialog is audited": a context
// without the shared fixture is a first visit, so the dialog is open on load.
for (const [label, options, uk] of [
  ["disclaimer dialog", {}, false],
  ["disclaimer dialog (dark)", { colorScheme: "dark" }, false],
  ["disclaimer dialog (uk)", { locale: "uk-UA" }, true],
] as const) {
  test(`the ${label} is accessible`, async ({ browser }) => {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    await page.goto("/");
    const name = uk ? "Перед зануренням" : "Before you dive";
    await expect(page.getByRole("dialog", { name })).toBeVisible();
    await expectAccessible(page, label);
    await context.close();
  });
}

// Spec shared/accessibility "The phone map is audited".
test("the phone map is accessible with the sheet expanded and the filters open", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Show all" }).click();
  await expect(page.getByRole("button", { name: "Show less" })).toBeVisible();
  await expectAccessible(page, "phone map, sheet expanded");

  await page.getByRole("button", { name: /^Filters/ }).click();
  await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
  await expectAccessible(page, "phone map, filters dialog");
});
