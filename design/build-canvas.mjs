// Wraps the plain-HTML screens in design/screens/ into Claude Design canvas artboards (.dc.html),
// so the repository stays the source and the claude.ai canvas is a mirror.
// Usage: node design/build-canvas.mjs <out-dir> [--created-at <RFC 3339>] [--ds-url <url> --ds-version <id>]
// Writes <out-dir>/project/canvas.json and <out-dir>/project/<Screen>.dc.html.
// Each screen declares its frame in <head>: <!-- @screen w=1280 h=860 title="…" -->.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const [outDir] = process.argv.slice(2);
if (!outDir) {
  console.error("Usage: node design/build-canvas.mjs <out-dir> [--created-at <RFC 3339>]");
  process.exit(2);
}
const createdAtIndex = process.argv.indexOf("--created-at");
const createdAt = createdAtIndex > 0 ? process.argv[createdAtIndex + 1] : new Date().toISOString();
const option = (flag) => {
  const index = process.argv.indexOf(flag);
  return index > 0 ? process.argv[index + 1] : undefined;
};
// The design-system artifact the canvas installs under project/ds/divenet/ (see docs/DESIGN.md).
const dsUrl = option("--ds-url");
const dsVersion = option("--ds-version");

const screensDir = fileURLToPath(new URL("./screens/", import.meta.url));
// The entry artboard first, then the canvas reading order.
const ORDER = ["Map", "Site", "ReviewForm", "Auth", "SubmitSite", "DiveLog", "Profile", "Feed", "PostEditor", "Moderation", "MobileMap", "MobileSite"];
const DS = "divenet";

const files = readdirSync(screensDir).filter((f) => f.endsWith(".html"));
const names = files.map((f) => f.replace(/\.html$/, ""));
const ordered = [...ORDER.filter((n) => names.includes(n)), ...names.filter((n) => !ORDER.includes(n)).sort()];

const project = join(outDir, "project");
mkdirSync(project, { recursive: true });

const boards = {};
const order = [];
let x = 0;
let y = 0;
let rowHeight = 0;
let column = 0;

for (const name of ordered) {
  const html = readFileSync(join(screensDir, `${name}.html`), "utf8");
  const meta = /<!--\s*@screen\s+([^>]*?)-->/.exec(html)?.[1] ?? "";
  const attr = (key) => new RegExp(`${key}=("([^"]*)"|(\\S+))`).exec(meta)?.slice(2).find(Boolean);
  const w = Number(attr("w") ?? 1280);
  const h = Number(attr("h") ?? 900);
  const title = attr("title") ?? name;
  const pageTitle = /<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? name;
  const fonts = /<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com[^"]+)"/.exec(html)?.[1];
  const body = /<body>([\s\S]*?)<\/body>/.exec(html)?.[1].trim() ?? "";
  const lang = /<html lang="([^"]+)"/.exec(html)?.[1] ?? "en";
  const phone = w < 600;

  const artboard = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<title>${pageTitle}</title>
<script src="./support.js"></script>
<link rel="stylesheet" href="ds/${DS}/tokens.css">
<link rel="stylesheet" href="ds/${DS}/components/bundle.css">
</head>
<body>
<x-dc>
<helmet>
${fonts ? `<link rel="stylesheet" href="${fonts}">\n` : ""}<style>
body{margin:0}
</style>
</helmet>
${body}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${w},"height":${h}}}'>
class Component extends DCLogic {
renderVals() {
return {};
}
}
</script>
</body>
</html>
`;
  // The canvas opens on Main.dc.html, so the first screen takes that name.
  const file = name === ordered[0] ? "Main.dc.html" : `${name}.dc.html`;
  writeFileSync(join(project, file), artboard);

  // Desktop pages in rows of three, phone screens on their own row.
  if (phone && column !== 0 && !boards[order.at(-1)]?.phone) {
    y += rowHeight + 120;
    x = 0;
    rowHeight = 0;
    column = 0;
  }
  boards[file] = { x, y, w, h, title, ...(phone ? {} : { expand: "fill" }) };
  Object.defineProperty(boards[file], "phone", { value: phone, enumerable: false });
  order.push(file);
  rowHeight = Math.max(rowHeight, h);
  column += 1;
  if (!phone && column === 3) {
    y += rowHeight + 120;
    x = 0;
    rowHeight = 0;
    column = 0;
  } else {
    x += w + 80;
  }
}

const canvas = {
  v: 3,
  createdOnFiles: { v: 1, at: createdAt },
  title: "DiveNet Screens",
  launch: { view: "canvas" },
  pages: [],
  boards,
  order,
  notes: {},
  designSystems: dsUrl
    ? [{ title: "DiveNet", namespace: DS, artifact: dsUrl, version: dsVersion ?? null, copiedAt: createdAt }]
    : [],
};
writeFileSync(join(project, "canvas.json"), `${JSON.stringify(canvas, null, 2)}\n`);
console.log(`Wrote ${order.length} artboards to ${project}`);
