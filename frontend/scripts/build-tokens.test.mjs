// @vitest-environment node
// Covers the gate step `node design/build-tokens.mjs --check`. The stale case runs a copy of the
// generator in a temporary directory, so the repository's tokens files are never touched.
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const DESIGN_DIR = fileURLToPath(new URL("../../design/", import.meta.url));
const runCheck = (/** @type {string} */ designDir) =>
  spawnSync(process.execPath, [join(designDir, "build-tokens.mjs"), "--check"], {
    encoding: "utf8",
  });

/** @type {string | undefined} */
let tempDir;
afterEach(() => {
  if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  tempDir = undefined;
});

describe("shared/design-tokens: A stale token stylesheet fails the gate", () => {
  it("passes when tokens.css equals the generator output", () => {
    const result = runCheck(DESIGN_DIR);

    expect(result.status).toBe(0);
  });

  it("fails, names the regenerate command and leaves tokens.css unchanged", () => {
    tempDir = mkdtempSync(join(tmpdir(), "divenet-tokens-"));
    mkdirSync(join(tempDir, "system"));
    copyFileSync(join(DESIGN_DIR, "build-tokens.mjs"), join(tempDir, "build-tokens.mjs"));
    copyFileSync(join(DESIGN_DIR, "system/tokens.css"), join(tempDir, "system/tokens.css"));
    /** @type {{ spacing: { tokens: { name: string, value: string }[] } }} */
    const tokens = JSON.parse(readFileSync(join(DESIGN_DIR, "system/tokens.json"), "utf8"));
    const space = tokens.spacing.tokens.find((token) => token.name === "space-4");
    if (!space) throw new Error("tokens.json has no space-4");
    space.value = "18px";
    writeFileSync(join(tempDir, "system/tokens.json"), JSON.stringify(tokens));
    const before = readFileSync(join(tempDir, "system/tokens.css"), "utf8");

    const result = runCheck(tempDir);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("node design/build-tokens.mjs");
    expect(readFileSync(join(tempDir, "system/tokens.css"), "utf8")).toBe(before);
  });
});
