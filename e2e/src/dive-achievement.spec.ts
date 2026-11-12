// Journey: a seeded demo diver logs dives and the ten-dives achievement is
// announced (spec shared/e2e, "A demo diver logs a dive and earns an
// achievement"). Sofia starts with 8 seeded dives at 8 distinct sites, so the
// second entry of this journey is her tenth dive and her tenth distinct site:
// the banner for "Ten dives" and "Site collector" must appear after that save.
import { expect, test } from "@playwright/test";
import { DEMO_PASSWORD, demoDiver, login } from "./support";

test("a demo diver logs a dive and earns an achievement", async ({ page }) => {
  await login(page, demoDiver.sofia, DEMO_PASSWORD, "Sofia Alvarez");
  await page.goto("/dive-log");
  await expect(page.getByRole("region", { name: "Logged dives" })).toBeVisible();

  /** Adds one entry to the log and waits for the new row to appear in the table. */
  async function logDive(siteName: string, depth: string) {
    await page.getByRole("button", { name: "Log a dive" }).click();
    // Scope every field to the form: the log table below it holds "Edit dive at
    // <site>" buttons and links whose names also match a site search.
    const form = page.getByRole("form", { name: "Log a dive" });
    await form.getByLabel("Site").fill(siteName);
    await form.getByRole("button", { name: new RegExp(siteName) }).first().click();
    await form.getByLabel("Date").fill("2026-11-12");
    await form.getByLabel("Max depth (m)").fill(depth);
    await form.getByRole("button", { name: "Save dive" }).click();
    // A freshly logged dive has no water temperature or visibility yet, which
    // tells the new row apart from a seeded dive at the same site.
    await expect(
      page
        .getByRole("region", { name: "Logged dives" })
        .getByRole("row", { name: new RegExp(`12 Nov 2026.*${siteName}.*${depth} m — —`) }),
    ).toBeVisible();
  }

  await logDive("Osprey", "18");
  await logDive("SS Thistlegorm", "31");

  // The second save was dive number ten at the tenth distinct site: the
  // achievement banner announces both.
  await expect(page.getByText("Achievement unlocked: Ten dives")).toBeVisible();
  await expect(page.getByText("Achievement unlocked: Site collector")).toBeVisible();
});
