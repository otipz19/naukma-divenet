// Serves a page with all figures, rebuilt on every request: node docs/uml/src/preview.mjs [port]
// Opening /export draws each figure on a canvas and saves it as docs/uml/png/<name>.png.
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const here = dirname(fileURLToPath(import.meta.url));
const build = join(here, 'build.mjs');
const page = join(tmpdir(), 'divenet-uml-preview.html');
const pngDir = join(here, '..', 'png');
const port = Number(process.argv[2] ?? 5199);

const SCALE = 3;
const MARGIN = 10;

// Runs in the browser, after the draw.io viewer has rendered the figures.
const exportScript = `<script>
async function exportFigure(heading, holder) {
  const svg = holder.querySelector('svg');
  // Only drawn shapes count: the viewer gives text boxes a size of 20000 so that labels never clip.
  // Corners go through each shape's transform, because the viewer shifts the drawing and rotates some shapes.
  const corners = [...svg.querySelectorAll('path, rect, ellipse')].flatMap((shape) => {
    const b = shape.getBBox();
    const matrix = shape.getCTM();
    return [
      [b.x, b.y],
      [b.x + b.width, b.y + b.height],
      [b.x + b.width, b.y],
      [b.x, b.y + b.height],
    ].map(([x, y]) => new DOMPoint(x, y).matrixTransform(matrix));
  });
  const left = Math.min(...corners.map((p) => p.x));
  const top = Math.min(...corners.map((p) => p.y));
  const width = Math.ceil(Math.max(...corners.map((p) => p.x)) - left + ${MARGIN} * 2);
  const height = Math.ceil(Math.max(...corners.map((p) => p.y)) - top + ${MARGIN} * 2);
  const copy = svg.cloneNode(true);
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  copy.setAttribute('viewBox', [left - ${MARGIN}, top - ${MARGIN}, width, height].join(' '));
  copy.setAttribute('width', width * ${SCALE});
  copy.setAttribute('height', height * ${SCALE});
  copy.removeAttribute('style');
  const image = new Image();
  image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(copy));
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);
  const blob = await new Promise((done) => canvas.toBlob(done, 'image/png'));
  const response = await fetch('/png/' + heading, { method: 'POST', body: blob });
  if (!response.ok) throw new Error(heading + ': ' + response.status);
  return heading + ' ' + canvas.width + 'x' + canvas.height;
}
window.addEventListener('load', async () => {
  const report = document.createElement('pre');
  report.id = 'export-report';
  try {
    await new Promise((done) => setTimeout(done, 1000));
    const headings = [...document.querySelectorAll('h3')];
    const holders = [...document.querySelectorAll('.mxgraph')];
    const lines = [];
    for (let i = 0; i < headings.length; i += 1) lines.push(await exportFigure(headings[i].textContent, holders[i]));
    report.textContent = 'done ' + lines.length + '\\n' + lines.join('\\n');
  } catch (error) {
    report.textContent = 'failed: ' + error;
  }
  document.body.prepend(report);
});
</script>`;

async function savePng(request, response, name) {
  if (!/^[a-z-]+$/.test(name)) {
    response.writeHead(400).end();
    return;
  }
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  await mkdir(pngDir, { recursive: true });
  await writeFile(join(pngDir, `${name}.png`), Buffer.concat(chunks));
  response.writeHead(204).end();
}

createServer(async (request, response) => {
  try {
    if (request.method === 'POST' && request.url.startsWith('/png/')) {
      await savePng(request, response, request.url.slice('/png/'.length));
      return;
    }
    if (request.url !== '/' && request.url !== '/export') {
      response.writeHead(404).end();
      return;
    }
    await promisify(execFile)(process.execPath, [build, page]);
    const html = (await readFile(page, 'utf8')).replace('</body>', `${request.url === '/export' ? exportScript : ''}</body>`);
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(html);
  } catch (error) {
    response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }).end(`${error.stdout}\n${error.stderr}`);
  }
}).listen(port, '127.0.0.1', () => console.log(`UML preview on http://localhost:${port}`));
