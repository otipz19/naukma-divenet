// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { findTokenProblems, readTokenNames } from "./check-css-tokens.mjs";

const tokens = readTokenNames(
  readFileSync(new URL("../../design/system/tokens.css", import.meta.url), "utf8"),
);
const check = (/** @type {string} */ css) =>
  findTokenProblems([{ path: "src/x.module.css", css }], tokens);

describe("shared/design-tokens: Front-end styles use tokens, not literal values", () => {
  it("passes tokens, hairlines and px inside media query conditions", () => {
    expect(
      check(`/* #fff and 12px in a comment are ignored */
.link {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  box-shadow: inset 0 -2px 0 var(--on-brand);
  background: transparent;
  color: currentColor;
}
@media (max-width: 767px) {
  .link:hover { outline-offset: 2px; }
}`),
    ).toEqual([]);
  });

  it("rejects a literal hex colour and names the file and line", () => {
    expect(check(".a {\n  color: #0b5bb0;\n}")).toEqual([
      "src/x.module.css:2: literal colour #0b5bb0",
    ]);
  });

  it("rejects rgb() and hsl() colours", () => {
    expect(check(".a { color: rgb(0 0 0); background: hsla(0, 0%, 0%, 0.5) }")).toEqual([
      "src/x.module.css:1: literal colour rgb()",
      "src/x.module.css:1: literal colour hsla()",
    ]);
  });

  it("rejects a literal px size", () => {
    expect(check(".a {\n  margin: 0;\n  padding: 12px;\n}")).toEqual([
      "src/x.module.css:3: literal length 12px (use a token)",
    ]);
  });

  it("rejects a named colour but accepts transparent and currentColor", () => {
    expect(
      check(".a { color: white; border-color: currentColor; background: transparent }"),
    ).toEqual(["src/x.module.css:1: literal colour white"]);
  });

  it("does not treat class names or token names as colours", () => {
    expect(check(".red, .tan { color: var(--ink); background: var(--accent-soft) }")).toEqual([]);
  });
});

describe("shared/design-tokens: The app uses the repository's design tokens", () => {
  it("reads the token names from tokens.css", () => {
    expect(tokens.has("--accent")).toBe(true);
    expect(tokens.has("--space-4")).toBe(true);
  });

  it("rejects a redefined token and names the file and line", () => {
    expect(check(".a {\n  --accent: var(--danger);\n}")).toEqual([
      "src/x.module.css:2: redefines design token --accent",
    ]);
  });

  it("allows local custom properties", () => {
    expect(check(".a { --drawer-shift: var(--space-4); }")).toEqual([]);
  });
});
