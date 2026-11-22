// Journey: a seeded demo diver logs dives and the ten-dives achievement is
// announced (spec shared/e2e, "A demo diver logs a dive and earns an
// achievement"). Sofia starts with 8 seeded dives at 8 distinct sites, so the
// second entry of this journey is her tenth dive and her tenth distinct site:
// the toasts for "Ten dives" and "Site collector" must appear after that save.
// Each dive is logged in the Log a dive dialog (spec shared/dialogs).
import { DEMO_PASSWORD, demoDiver, expect, login, test } from "./support";

test("a demo diver logs a dive and earns an achievement", async ({ page }) => {
  await login(page, demoDiver.sofia, DEMO_PASSWORD, "Sofia Alvarez");
  await page.goto("/dive-log");
  await expect(page.getByRole("region", { name: "Logged dives" })).toBeVisible();

  /** Adds one entry to the log and waits for the new row to appear in the table. */
  async function logDive(siteName: string, depth: string) {
    await page.getByRole("button", { name: "Log a dive" }).click();
    // Scope every field to the dialog: the log table behind it holds "Edit dive
    // at <site>" buttons and links whose names also match a site search.
    const form = page.getByRole("dialog", { name: "Log a dive" });
    await expect(form).toBeVisible();
    await form.getByLabel("Site").fill(siteName);
    await form.getByRole("button", { name: new RegExp(siteName) }).first().click();
    await form.getByLabel("Date").fill("2026-11-12");
    await form.getByLabel("Max depth (m)").fill(depth);
    await form.getByRole("button", { name: "Save dive" }).click();
    await expect(form).toBeHidden();
    // A freshly logged dive has no water temperature or visibility yet, which
    // tells the new row apart from a seeded dive at the same site.
    await expect(
      page
        .getByRole("region", { name: "Logged dives" })
        .getByRole("row", { name: new RegExp(`12 Nov 2026.*${siteName}.*${depth} m — —`) }),
    ).toBeVisible();
  }

  // The native dialog: it is modal, Escape closes it, and focus returns to the
  // button that opened it.
  const opener = page.getByRole("button", { name: "Log a dive" });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Log a dive" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Site")).toBeFocused();
  // The page behind is inert: Tab never reaches it. Past the last control the
  // browser may move focus to its own UI, which leaves the body as activeElement.
  for (let tab = 0; tab < 15; tab += 1) {
    await page.keyboard.press("Tab");
    const onPage = await dialog.evaluate(
      (element) =>
        document.activeElement !== document.body && !element.contains(document.activeElement),
    );
    expect(onPage).toBe(false);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();

  await logDive("Osprey", "18");
  await logDive("SS Thistlegorm", "31");

  // The second save was dive number ten at the tenth distinct site: one toast
  // announces each, in the shell's status region.
  const toasts = page.getByRole("status").filter({ hasText: "Achievement unlocked" });
  await expect(toasts.getByText("Achievement unlocked: Ten dives")).toBeVisible();
  await expect(toasts.getByText("Achievement unlocked: Site collector")).toBeVisible();
  await expect(toasts.getByRole("link", { name: "See achievements" }).first()).toBeVisible();
});
