// The accessibility audits (spec shared/accessibility): every routed page is
// scanned against WCAG 2.1 A/AA in its rendered, data-carrying state. Pages are
// reached through the same flows the journeys use. Both color themes come from
// the system preference (frontend/src/app/theme.ts), so dark-theme scans run in
// a colorScheme: "dark" context; the uk locale is scanned on pages whose chrome
// translates.
import { expect, test } from "@playwright/test";
import { DEMO_PASSWORD, admin, demoDiver, login } from "./support";
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
//    preference into <html data-theme> live, and an attribute pinning light
//    beats an OS dark setting through the media block's :not() negation.
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

test("anonymous pages are accessible in the dark theme", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "dark" });
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
  await expectAccessible(page, "dive log");
  await page.goto("/dive-log/new");
  await expectAccessible(page, "dive log entry form");

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
  await expectAccessible(page, "certificates");
});

test("the admin moderation page is accessible", async ({ page }) => {
  await login(page, admin.email, admin.password, "Admin");
  await page.goto("/admin/moderation");
  await expectAccessible(page, "admin moderation");
});
