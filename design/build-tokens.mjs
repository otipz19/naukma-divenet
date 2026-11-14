// Compiles design/system/tokens.json into design/system/tokens.css.
// Usage: node design/build-tokens.mjs           write tokens.css
//        node design/build-tokens.mjs --check   exit 1 if tokens.css is stale
// The layout follows the Claude Design "Design System" type, so the claude.ai mirror and the repo agree.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("./system/", import.meta.url));
const tokens = JSON.parse(readFileSync(`${dir}tokens.json`, "utf8"));
const [first, ...others] = tokens.color.themes.map((theme) => theme.id);

const valueIn = (token, theme) =>
  typeof token.value === "string" ? token.value : (token.value[theme] ?? token.value[first]);
// "{name}" aliases become var(--name).
const css = (value) => value.replace(/^\{([^}]+)\}$/, "var(--$1)");
const declare = (list, theme) => list.map((t) => `  --${t.name}: ${css(valueIn(t, theme))};`);
const themed = [...tokens.color.tokens, ...(tokens.shadow?.tokens ?? [])];

const blocks = [`/* ${tokens.name} — generated from tokens.json */`];
const firstBody = declare(themed, first).concat(["  color-scheme: light;"]).join("\n");
blocks.push(`:root, [data-theme="${first}"] {\n${firstBody}\n}`);
// Each non-default theme activates two ways: the explicit attribute, and the
// OS preference unless the attribute pins another theme. The body is duplicated because a media query cannot
// share a selector list with a plain rule; the generator keeps copies identical.
for (const theme of others) {
  const body = declare(themed, theme).concat(["  color-scheme: "+theme+";"]).join("\n");
  blocks.push(`[data-theme="${theme}"] {\n${body}\n}`);
  blocks.push(
    `@media (prefers-color-scheme: ${theme}) {\n  :root:not([data-theme="${first}"]) {\n${body.split("\n").map((l) => `  ${l}`).join("\n")}\n  }\n}`,
  );
}

const plain = Object.entries(tokens)
  .filter(([key, family]) => !["color", "type", "shadow"].includes(key) && family?.tokens)
  .flatMap(([, family]) => family.tokens.map((t) => `  --${t.name}: ${t.value};`));
const fonts = Object.entries(tokens.type.families).map(([key, stack]) => `  --font-${key}: ${stack};`);
blocks.push(`:root {\n${[...plain, ...fonts].join("\n")}\n}`);
for (const group of tokens.type.groups) {
  for (const style of group.styles) {
    const rules = [`font-family: var(--font-${style.family ?? group.family});`];
    // rem, not px: the type scale must honor the browser's root font-size preference.
    const rem = (v) => v.replace(/^([0-9.]+)px$/, (_, n) => `${Number(n) / 16}rem`);
    rules.push(`font-size: ${rem(style.fontSize)};`, `line-height: ${style.lineHeight};`);
    if (style.fontWeight) rules.push(`font-weight: ${style.fontWeight};`);
    if (style.letterSpacing) rules.push(`letter-spacing: ${style.letterSpacing};`);
    blocks.push(`.${style.name} {\n  ${rules.join("\n  ")}\n}`);
  }
}
const output = `${blocks.join("\n\n")}\n`;

const target = `${dir}tokens.css`;
if (process.argv.includes("--check")) {
  const current = readFileSync(target, "utf8").replace(/\r\n/g, "\n");
  if (current !== output) {
    console.error("design/system/tokens.css is stale. Run: node design/build-tokens.mjs");
    process.exit(1);
  }
  console.log("design/system/tokens.css matches tokens.json.");
} else {
  writeFileSync(target, output);
  console.log("Wrote design/system/tokens.css.");
}
