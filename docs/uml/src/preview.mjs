// Serves a page with all figures, rebuilt on every request: node docs/uml/src/preview.mjs [port]
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const build = join(dirname(fileURLToPath(import.meta.url)), 'build.mjs');
const page = join(tmpdir(), 'divenet-uml-preview.html');
const port = Number(process.argv[2] ?? 5199);

createServer(async (request, response) => {
  if (request.url !== '/') {
    response.writeHead(404).end();
    return;
  }
  try {
    await promisify(execFile)(process.execPath, [build, page]);
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(await readFile(page));
  } catch (error) {
    response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }).end(`${error.stdout}\n${error.stderr}`);
  }
}).listen(port, '127.0.0.1', () => console.log(`UML preview on http://localhost:${port}`));
