// The accessibility audit helper (spec shared/accessibility). axe-core scans the
// live rendered page; critical and serious violations fail, moderate and minor
// ones are reported. Accepted exceptions live in ACCEPTED with a rule id and a
// reason, and a stale entry (matching nothing anymore) fails the suite, so the
// list cannot rot into a permanent allow-all.
import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

export type Impact = "critical" | "serious" | "moderate" | "minor";

interface Accepted {
  ruleId: string;
  reason: string;
}

const ACCEPTED: Accepted[] = [
  // Filled during triage; every entry must match a live violation or the audit fails.
];

export async function expectAccessible(page: Page, label: string) {
  // Scan the settled page: mid-transition (a dialog's fade-in) colours are
  // blended and fail contrast falsely. Infinite animations (spinners) never
  // finish, so they are not awaited.
  await page.evaluate(async () => {
    const finite = document.getAnimations().filter((a) => {
      const end = a.effect?.getComputedTiming().endTime;
      return Number.isFinite(Number(end));
    });
    await Promise.all(finite.map((a) => a.finished.catch(() => undefined)));
  });
  const builder = new AxeBuilder({ page }).withTags([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
  ]);
  const results = await builder.analyze();

  const unaccepted = results.violations.filter((v) => {
    if (v.impact !== "critical" && v.impact !== "serious") return false;
    return !ACCEPTED.some((a) => a.ruleId === v.id);
  });

  const reported = results.violations.filter(
    (v) => v.impact === "moderate" || v.impact === "minor",
  );
  if (reported.length > 0) {
    console.log(
      `[audit] ${label}: reported (not failing):\n` +
        reported
          .map((v) => `  ${v.impact} ${v.id} ${v.nodes.map((n) => n.target[0]).join(", ")}`)
          .join("\n"),
    );
  }

  // Keep the accepted list honest: an entry that matches nothing is stale.
  for (const a of ACCEPTED) {
    if (!results.violations.some((v) => v.id === a.ruleId)) {
      throw new Error(
        `[audit] ${label}: accepted exception "${a.ruleId}" matches no violation anymore — remove it. Reason it was accepted: ${a.reason}`,
      );
    }
  }

  expect(
    unaccepted,
    `${label}: accessibility violations (rule, impact, selector)` +
      "\n" +
      unaccepted
        .map(
          (v) =>
            `${v.id} (${v.impact}) ${v.nodes.map((n) => n.target[0]).join(", ")} — ${v.helpUrl}`,
        )
        .join("\n"),
  ).toEqual([]);
}
