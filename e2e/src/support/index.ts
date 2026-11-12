// Shared helpers for the E2E journeys (spec shared/e2e). Journeys drive the
// real UI with role-based selectors only; no test ids exist in the app.

/** The demo password every seeded diver uses (spec demo/seed). */
export const DEMO_PASSWORD = "divenet-demo";

/** A seeded demo diver, by email. */
export const demoDiver = {
  yaryna: "yaryna@demo.divenet.test",
  marco: "marco@demo.divenet.test",
  aiko: "aiko@demo.divenet.test",
  bohdan: "bohdan@demo.divenet.test",
  sofia: "sofia@demo.divenet.test",
  james: "james@demo.divenet.test",
  ingrid: "ingrid@demo.divenet.test",
  nomvula: "nomvula@demo.divenet.test",
} as const;

/** The stack's admin, set by scripts/run-e2e.mjs when it starts the stack. */
export const admin = {
  email: process.env.DIVENET_E2E_ADMIN_EMAIL ?? "admin@e2e.divenet.test",
  password: process.env.DIVENET_E2E_ADMIN_PASSWORD ?? "divenet-e2e-admin",
};

/** A unique email, so parallel and repeated runs never collide. */
export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

import type { Page } from "@playwright/test";

/** Logs in through the login page, and waits until the account menu shows the name. */
export async function login(page: Page, email: string, password: string, name: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.getByRole("button", { name: `Account menu: ${name}` }).waitFor();
}

/** Logs out through the account menu. */
export async function logout(page: Page) {
  await page.getByRole("button", { name: /^Account menu:/ }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await page.getByRole("link", { name: "Log in" }).waitFor();
}
