// Locale key-parity check (gate step): every key exists, non-empty, in every locale file.
// Usage: node scripts/check-i18n.mjs   (exits 1 and lists each missing key)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const LOCALES_DIR = new URL("../src/i18n/locales/", import.meta.url);
const LOCALES = ["en", "uk"];

/**
 * Flattens nested translations to dotted keys. Empty strings are left out, so they count as missing.
 * @param {unknown} node
 * @param {string} [prefix]
 * @returns {string[]}
 */
export function flattenKeys(node, prefix = "") {
  if (typeof node === "string") return node === "" ? [] : [prefix];
  if (typeof node !== "object" || node === null) return [prefix];
  return Object.entries(node).flatMap(([key, value]) =>
    flattenKeys(value, prefix ? `${prefix}.${key}` : key),
  );
}

/**
 * @param {Record<string, unknown>} localesByFile translations keyed by file name
 * @returns {string[]} one message per key missing from a file
 */
export function findMissingKeys(localesByFile) {
  const keysByFile = Object.fromEntries(
    Object.entries(localesByFile).map(([file, data]) => [file, new Set(flattenKeys(data))]),
  );
  const allKeys = [...new Set(Object.values(keysByFile).flatMap((keys) => [...keys]))].sort();
  return Object.entries(keysByFile).flatMap(([file, keys]) =>
    allKeys.filter((key) => !keys.has(key)).map((key) => `${key} is missing in ${file}`),
  );
}

function main() {
  const localesByFile = Object.fromEntries(
    LOCALES.map((locale) => {
      const file = new URL(`${locale}.json`, LOCALES_DIR);
      return [`src/i18n/locales/${locale}.json`, JSON.parse(readFileSync(file, "utf8"))];
    }),
  );
  const problems = findMissingKeys(localesByFile);
  if (problems.length > 0) {
    console.error(`Locale files are out of sync (${problems.length} missing):`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(`Locale files in sync: ${LOCALES.join(", ")}.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
