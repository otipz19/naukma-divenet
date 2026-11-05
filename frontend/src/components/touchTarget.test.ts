import { describe, expect, it } from "vitest";

// jsdom does no layout, and Vitest stubs CSS imports, so the rule is checked in the files themselves.
// The front-end has no Node types, so node:fs is typed here for the one call it makes.
const { readFileSync } = (await import(String("node:fs"))) as {
  readFileSync: (path: URL, encoding: "utf8") => string;
};
const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

/** The rules from `@media (max-width: 767px)` on, the phone breakpoint below bp-md. */
function phoneRules(css: string): string {
  const start = css.indexOf("@media (max-width: 767px)");
  expect(start).toBeGreaterThanOrEqual(0);
  return css.slice(start);
}

describe("shared/app-shell: Controls are large enough to touch on phones", () => {
  it("sizes buttons and chips with the touch target on phones", () => {
    expect(phoneRules(read("./Button/Button.module.css"))).toContain(
      "min-height: var(--touch-target)",
    );
    expect(phoneRules(read("./Chip/Chip.module.css"))).toContain("min-height: var(--touch-target)");
  });

  it("defines the touch target as 44 px", () => {
    expect(read("../../../design/system/tokens.css")).toContain("--touch-target: 44px;");
  });
});
