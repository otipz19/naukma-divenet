// Tokens-only CSS check (gate step): front-end styles use design tokens, not literal values
// (docs/DESIGN.md rule 1). Fails on a literal colour, a px length other than a 1-2px hairline,
// or a redefined design token. Selectors and at-rule preludes (such as @media conditions) are
// not checked, since custom properties cannot be used there.
// Usage: node scripts/check-css-tokens.mjs   (exits 1 and prints file:line: message per problem)
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC_DIR = fileURLToPath(new URL("../src/", import.meta.url));
const TOKENS_CSS = new URL("../../design/system/tokens.css", import.meta.url);

// The CSS named colours. `transparent` and `currentColor` are keywords, not in this list, and allowed.
const NAMED_COLOURS = new Set(
  `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet
  brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue
  darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange
  darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise
  darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen
  fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred
  indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan
  lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen
  lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta
  maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue
  mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin
  navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen
  paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red
  rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue
  slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white
  whitesmoke yellow yellowgreen`.split(/\s+/),
);
const HAIRLINE = /^-?[12]px$/;

/**
 * @param {string} css contents of design/system/tokens.css
 * @returns {Set<string>} the custom property names it declares, such as `--accent`
 */
export function readTokenNames(css) {
  return new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]));
}

/**
 * Blanks comments and strings, keeping newlines so offsets still map to the same lines.
 * @param {string} css
 */
function blankComments(css) {
  const blank = (/** @type {string} */ text) => text.replace(/[^\n]/g, " ");
  return css.replace(/\/\*[\s\S]*?\*\/|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, blank);
}

/**
 * @param {string} value a declaration value
 * @returns {string[]} what is wrong with it
 */
function valueProblems(value) {
  const problems = [];
  // Token references and URLs may contain anything; only the literal part of a value is checked.
  const literal = value.replace(/var\(\s*--[\w-]+\s*\)|url\([^)]*\)/g, " ");
  for (const [hex] of literal.matchAll(/#[0-9a-f]{3,8}\b/gi))
    problems.push(`literal colour ${hex}`);
  for (const [fn] of literal.matchAll(/\b(?:rgba?|hsla?)\(/gi)) {
    problems.push(`literal colour ${fn.slice(0, -1)}()`);
  }
  for (const [word] of literal.matchAll(/(?<![\w-])[a-z]+(?![\w-])/gi)) {
    if (NAMED_COLOURS.has(word.toLowerCase())) problems.push(`literal colour ${word}`);
  }
  for (const [length] of literal.matchAll(/-?\d*\.?\d+px\b/g)) {
    if (!HAIRLINE.test(length)) problems.push(`literal length ${length} (use a token)`);
  }
  return problems;
}

/**
 * @param {{ path: string, css: string }[]} files stylesheets to check
 * @param {Set<string>} tokenNames custom properties owned by the design system
 * @returns {string[]} one `path:line: message` per problem
 */
export function findTokenProblems(files, tokenNames) {
  return files.flatMap(({ path, css }) => {
    const text = blankComments(css);
    const lineAt = (/** @type {number} */ offset) => text.slice(0, offset).split("\n").length;
    const problems = [];
    // A segment ending in `{` is a selector or an at-rule prelude; one ending in `;` or `}` is a declaration.
    for (const match of text.matchAll(/[^{};]+(?=[;}]|$)/g)) {
      const declaration = /^(\s*)([-\w]+)\s*:([\s\S]*)$/.exec(match[0]);
      if (!declaration) continue;
      const [, indent, property, value] = declaration;
      const line = lineAt(match.index + indent.length);
      if (tokenNames.has(property)) {
        problems.push(`${path}:${line}: redefines design token ${property}`);
      }
      for (const problem of valueProblems(value)) problems.push(`${path}:${line}: ${problem}`);
    }
    return problems;
  });
}

function main() {
  const files = readdirSync(SRC_DIR, { recursive: true })
    .map((file) => String(file).replaceAll("\\", "/"))
    .filter((file) => file.endsWith(".css"))
    .sort()
    .map((file) => ({ path: `src/${file}`, css: readFileSync(`${SRC_DIR}${file}`, "utf8") }));
  const problems = findTokenProblems(files, readTokenNames(readFileSync(TOKENS_CSS, "utf8")));
  if (problems.length > 0) {
    console.error(`Front-end CSS must use design tokens (${problems.length} problems):`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(`Tokens-only CSS: ${files.length} stylesheets checked.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
