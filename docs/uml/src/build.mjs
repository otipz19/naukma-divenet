// Writes every figure in figures/ as ../<name>.drawio and fails on a layout problem.
// Usage: node docs/uml/src/build.mjs [preview.html]
// The optional page shows all figures through the draw.io viewer, for checking them in a browser.
import { readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkLayout } from './lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const files = (await readdir(join(here, 'figures'))).filter((f) => f.endsWith('.mjs')).sort();

let failed = false;
const previews = [];
for (const file of files) {
  const { default: figure } = await import(pathToFileURL(join(here, 'figures', file)).href);
  const problems = checkLayout(figure);
  for (const problem of problems) console.error(`${figure.name}: ${problem}`);
  failed ||= problems.length > 0;
  const xml = figure.toXml();
  await writeFile(join(here, '..', `${figure.name}.drawio`), xml);
  previews.push({ name: figure.name, xml });
  console.log(`${figure.name}: ${figure.nodes.size} boxes, ${figure.edges.length} lines, ${problems.length} problems`);
}

const previewPath = process.argv[2];
if (previewPath) {
  const attr = (s) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const blocks = previews.map(({ name, xml }) => {
    const config = JSON.stringify({ xml, highlight: 'none', nav: false, resize: false, toolbar: null });
    return `<h3>${name}</h3><div class="mxgraph" style="background:#fff" data-mxgraph="${attr(config)}"></div>`;
  });
  await writeFile(
    previewPath,
    `<!doctype html><meta charset="utf-8"><title>UML preview</title><body style="background:#fff;margin:8px">${blocks.join('')}<script src="https://viewer.diagrams.net/js/viewer-static.min.js"></script><script>GraphViewer.processElements()</script></body>`,
  );
}
process.exitCode = failed ? 1 : 0;
