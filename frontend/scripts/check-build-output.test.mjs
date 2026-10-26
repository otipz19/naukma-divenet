// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findBuildProblems } from "./check-build-output.mjs";

const COMPLETE = {
  "index.html": '<link rel="stylesheet" href="/assets/index.css">',
  "assets/index.css": ":root{--accent:#0a7570;--space-4:16px}",
  "assets/manrope-cyrillic-700-normal-abc.woff2": "",
  "assets/golos-text-cyrillic-400-normal-abc.woff2": "",
  "assets/jetbrains-mono-cyrillic-500-normal-abc.woff2": "",
};

/** @type {string[]} */
const tempDirs = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/**
 * Writes a fake build output directory.
 * @param {Record<string, string | null>} changes files to add or replace; null removes one
 */
function dist(changes = {}) {
  const dir = mkdtempSync(join(tmpdir(), "divenet-dist-"));
  tempDirs.push(dir);
  for (const [file, text] of Object.entries({ ...COMPLETE, ...changes })) {
    if (text === null) continue;
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    writeFileSync(join(dir, file), text);
  }
  return dir;
}

describe("shared/design-tokens: Token stylesheet is the design file", () => {
  it("passes a build with the tokens and the fonts", () => {
    expect(findBuildProblems(dist())).toEqual([]);
  });

  it("fails when no stylesheet defines a token property", () => {
    expect(findBuildProblems(dist({ "assets/index.css": ":root{--accent:#0a7570}" }))).toEqual([
      "no stylesheet defines the design token --space-4",
    ]);
  });
});

describe("shared/app-shell: Build bundles the fonts", () => {
  it.each([
    ["manrope-cyrillic", "assets/manrope-cyrillic-700-normal-abc.woff2"],
    ["golos-text-cyrillic", "assets/golos-text-cyrillic-400-normal-abc.woff2"],
    ["jetbrains-mono-cyrillic", "assets/jetbrains-mono-cyrillic-500-normal-abc.woff2"],
  ])("fails without a %s font file", (prefix, file) => {
    expect(findBuildProblems(dist({ [file]: null }))).toEqual([`no ${prefix}-*.woff2 font file`]);
  });

  it("fails when a file references a Google Fonts host", () => {
    const html = '<link href="https://fonts.googleapis.com/css2?family=Manrope">';

    expect(findBuildProblems(dist({ "index.html": html }))).toEqual([
      "index.html references fonts.googleapis.com",
    ]);
  });
});
