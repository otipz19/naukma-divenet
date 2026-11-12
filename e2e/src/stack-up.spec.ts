// The stack is up and serves the app (used to verify scripts/run-e2e.mjs).
import { expect, test } from "@playwright/test";

test("the app loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
});

// Spec shared/security "browser security headers": the web server must keep the
// protective headers and the restrictive policy clauses, so weakening one fails
// the suite. Assertions check the clauses that must never loosen, not the whole
// string: adding a documented allowance stays green.
test("the served app carries the browser security headers", async ({ request }) => {
  const response = await request.get("/");
  const csp = response.headers()["content-security-policy"] ?? "";
  expect(csp, "content-security-policy is present").toContain("default-src 'self'");
  expect(csp).toContain("script-src 'self'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");
  expect(response.headers()["strict-transport-security"]).toBe("max-age=31536000");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});
