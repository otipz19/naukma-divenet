// Build-output check (gate step, after `vite build`): the production build carries the design
// tokens and the self-hosted fonts, and references no third-party font host.
// Usage: node scripts/check-build-output.mjs   (exits 1 and lists each problem)
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DIST_DIR = fileURLToPath(new URL("../dist/", import.meta.url));
const REQUIRED_PROPERTIES = ["--accent", "--space-4"];
const CYRILLIC_FONTS = ["manrope-cyrillic", "golos-text-cyrillic", "jetbrains-mono-cyrillic"];
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];
const TEXT_FILE = /\.(?:html|css|js|json|svg|txt|webmanifest)$/;

/**
 * @param {string} distDir a Vite build output directory
 * @returns {string[]} one message per problem
 */
export function findBuildProblems(distDir) {
  const files = readdirSync(distDir, { recursive: true }).map((file) =>
    String(file).replaceAll("\\", "/"),
  );
  /** @type {Map<string, string>} */
  const texts = new Map(
    files
      .filter((file) => TEXT_FILE.test(file))
      .map((file) => [file, readFileSync(join(distDir, file), "utf8")]),
  );
  const stylesheets = [...texts].filter(([file]) => file.endsWith(".css")).map(([, text]) => text);
  const fontFiles = files
    .map((file) => file.split("/").pop() ?? "")
    .filter((name) => name.endsWith(".woff2"));

  const problems = [];
  for (const property of REQUIRED_PROPERTIES) {
    if (!stylesheets.some((css) => css.includes(`${property}:`))) {
      problems.push(`no stylesheet defines the design token ${property}`);
    }
  }
  for (const prefix of CYRILLIC_FONTS) {
    if (!fontFiles.some((name) => name.startsWith(`${prefix}-`))) {
      problems.push(`no ${prefix}-*.woff2 font file`);
    }
  }
  for (const [file, text] of texts) {
    for (const host of FONT_HOSTS) {
      if (text.includes(host)) problems.push(`${file} references ${host}`);
    }
  }
  return problems;
}

function main() {
  const problems = findBuildProblems(DIST_DIR);
  if (problems.length > 0) {
    console.error(`Production build output is incomplete (${problems.length} problems):`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log("Build output has the design tokens and self-hosted fonts.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
