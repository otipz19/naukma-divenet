// @vitest-environment node
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { afterEach, describe, expect, it } from "vitest";

const frontendDir = fileURLToPath(new URL("..", import.meta.url));
// Type-aware linting only sees files on disk, so the probe is written under src/ and removed afterwards.
const probeDir = fileURLToPath(new URL("../src/__lint-probe__/", import.meta.url));

/**
 * Lints `code` with the project's ESLint config as an application component.
 * @param {string} code
 */
async function lintComponent(code) {
  mkdirSync(probeDir, { recursive: true });
  const probeFile = `${probeDir}Probe.tsx`;
  writeFileSync(probeFile, code);
  const [result] = await new ESLint({ cwd: frontendDir }).lintFiles([probeFile]);
  expect(result.messages.filter((message) => message.fatal)).toEqual([]);
  return result.messages.filter((message) => message.ruleId === "i18next/no-literal-string");
}

afterEach(() => {
  rmSync(probeDir, { recursive: true, force: true });
});

// The first type-aware lint builds a TypeScript program over all of src/, which outgrows the
// default 5s timeout while other test files run in parallel.
describe("shared/i18n: User-visible text is never hard-coded", { timeout: 30_000 }, () => {
  it("rejects literal JSX text and reports its line", async () => {
    const messages = await lintComponent(
      ["export function Probe() {", "  return <p>Hello</p>;", "}", ""].join("\n"),
    );

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ line: 2, severity: 2 });
  });

  it("accepts translated text", async () => {
    const messages = await lintComponent(
      [
        'import { useTranslation } from "react-i18next";',
        "export function Probe() {",
        "  const { t } = useTranslation();",
        '  return <p>{t("home.title")}</p>;',
        "}",
        "",
      ].join("\n"),
    );

    expect(messages).toEqual([]);
  });
});
