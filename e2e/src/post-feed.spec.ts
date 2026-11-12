// Journey: a signed-in diver writes and publishes a post linked to a region,
// and it reaches the global feed (spec shared/e2e, "A published post reaches
// the global feed").
import { expect, test } from "@playwright/test";
import { DEMO_PASSWORD, demoDiver, login } from "./support";

test("a published post reaches the global feed", async ({ page }) => {
  const title = `E2E journey post ${Date.now()}`;

  await login(page, demoDiver.yaryna, DEMO_PASSWORD, "Ярина Затонська");
  await page.goto("/feed");
  await expect(page.getByRole("heading", { level: 1, name: "Feed" })).toBeVisible();

  await page.getByRole("link", { name: "Write a post" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "New post" })).toBeVisible();
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Text").fill("A post published by the E2E suite. It links a region.");
  await page.getByLabel("Region").selectOption({ label: "Great Barrier Reef" });
  await page.getByRole("button", { name: "Publish", exact: true }).click();

  // Publishing opens the post; the global feed lists it.
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await page.goto("/feed");
  await expect(
    page.getByRole("region", { name: "Posts" }).getByRole("heading", { name: title }),
  ).toBeVisible();
});
