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
blocks.push(`:root, [data-theme="${first}"] {\n${declare(themed, first).join("\n")}\n}`);
for (const theme of others) {
  blocks.push(`[data-theme="${theme}"] {\n${declare(themed, theme).join("\n")}\n}`);
}
const plain = Object.entries(tokens)
  .filter(([key, family]) => !["color", "type", "shadow"].includes(key) && family?.tokens)
  .flatMap(([, family]) => family.tokens.map((t) => `  --${t.name}: ${t.value};`));
const fonts = Object.entries(tokens.type.families).map(([key, stack]) => `  --font-${key}: ${stack};`);
blocks.push(`:root {\n${[...plain, ...fonts].join("\n")}\n}`);
for (const group of tokens.type.groups) {
  for (const style of group.styles) {
    const rules = [`font-family: var(--font-${style.family ?? group.family});`];
    rules.push(`font-size: ${style.fontSize};`, `line-height: ${style.lineHeight};`);
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
