// Smoke test of the running compose stack (CI job `stack`; spec shared/local-stack).
// Builds and starts the stack as the compose project `divenet-smoke` on WEB_PORT 18080, so it
// never touches a developer's own stack, checks it over HTTP, restarts it, and always removes
// its containers, network and volume. Before building, it pulls every image the stack uses
// (service images, Dockerfile `# syntax=` frontends and base images), trying each up to 3 times, so a transient
// registry error does not fail the run. Needs Docker; takes a few minutes.
// Usage: node scripts/smoke-stack.mjs   (or `pnpm smoke:stack`; exits 1 when a check fails)
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { externalImages, readDockerfiles } from "./compose-rules.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const ENV_EXAMPLE = join(ROOT, ".env.example");
export const PROJECT = "divenet-smoke";
export const WEB_PORT = "18080";
const SERVICES = ["db", "backend", "web"];
const WAIT = ["--wait", "--wait-timeout", "300"];
const STACK_VARIABLE = /^(POSTGRES_|WEB_PORT$|COMPOSE_|DB_)/i;
// Waits before the 2nd and 3rd pull attempt: a registry error such as a 502 is often over by then.
export const PULL_WAITS_MS = [10_000, 30_000];

/**
 * @typedef {{ status: number | null, stdout: string, stderr: string }} RunResult
 * @typedef {(args: string[]) => RunResult} Run runs `docker compose <args>` for the smoke project
 * @typedef {{ status: number, contentType: string, body: string }} HttpResult
 * @typedef {(path: string) => Promise<HttpResult>} Http sends GET <path> to the web port
 * @typedef {(image: string) => RunResult} Pull runs `docker pull -q <image>`
 * @typedef {{ images?: string[], pull?: Pull, sleep?: (ms: number) => Promise<void> }} PullOptions
 */

/**
 * @param {Run} run
 * @param {string[]} args
 */
function mustRun(run, args) {
  const result = run(args);
  if (result.status !== 0) {
    throw new Error(`docker compose ${args.join(" ")} exited ${result.status}\n${result.stderr}`);
  }
  return result.stdout;
}

/**
 * @param {boolean} condition
 * @param {string} message
 */
function check(condition, message) {
  if (!condition) throw new Error(message);
}

/** `docker compose ps --format json` prints an array or one object per line, by version. */
function parsePs(/** @type {string} */ text) {
  const trimmed = text.trim();
  if (trimmed.startsWith("[")) return JSON.parse(trimmed);
  return trimmed.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

/**
 * @param {Run} run
 * @param {{ db: string, user: string }} database
 */
function migrationHistory(run, database) {
  const sql = "SELECT installed_rank, installed_on FROM flyway_schema_history ORDER BY installed_rank";
  return mustRun(run, ["exec", "-T", "db", "psql", "-U", database.user, "-d", database.db, "-At", "-c", sql]).trim();
}

/**
 * Pulls each image before anything is built, retrying a failed pull, so a transient registry
 * error does not fail the run; the build then uses the local images.
 * @param {string[]} images
 * @param {Pull} pull
 * @param {(ms: number) => Promise<void>} sleep
 * @param {(line: string) => void} log
 */
async function pullImages(images, pull, sleep, log) {
  for (const image of images) {
    for (let attempt = 1; ; attempt++) {
      const result = pull(image);
      if (result.status === 0) break;
      if (attempt > PULL_WAITS_MS.length) {
        throw new Error(`could not pull ${image} after ${attempt} attempts
${result.stderr.trim()}`);
      }
      const wait = PULL_WAITS_MS[attempt - 1];
      log(`    pulling ${image} failed (attempt ${attempt}), retrying in ${wait / 1000} s: ${result.stderr.trim()}`);
      await sleep(wait);
    }
    log(`ok  pulled ${image}`);
  }
}

/**
 * Pulls the images, starts the stack, runs every check, and always tears it down.
 * @param {Run} run
 * @param {Http} http
 * @param {{ db: string, user: string }} database names from the env file
 * @param {(line: string) => void} log
 * @param {PullOptions} options images to pull first, and the runner and wait used for it
 * @returns {Promise<number>} the exit code
 */
export async function runSmoke(run, http, database, log = console.log, options = {}) {
  const { images = [], pull = () => ({ status: 0, stdout: "", stderr: "" }), sleep = wait } = options;
  let failed = false;
  try {
    await pullImages(images, pull, sleep, log);

    log("Starting the stack (build, then wait until healthy)...");
    mustRun(run, ["up", "--build", ...WAIT]);

    // Stack becomes healthy
    const states = parsePs(mustRun(run, ["ps", "--format", "json"]));
    for (const service of SERVICES) {
      const state = states.find((/** @type {any} */ s) => s.Service === service);
      check(state?.Health === "healthy", `${service} is ${state?.Health ?? "not running"}, expected healthy`);
    }
    log("ok  all services healthy");

    // Home page
    const home = await http("/");
    check(home.status === 200, `GET / returned ${home.status}`);
    check(home.contentType.includes("text/html"), `GET / content type is ${home.contentType}`);
    check(home.body.includes('<div id="root">'), "GET / has no <div id=\"root\">");
    log("ok  GET / serves the app");

    // Client-side route
    const route = await http("/no-such-page");
    check(route.status === 200 && route.body === home.body, "GET /no-such-page does not serve index.html");
    log("ok  GET /no-such-page falls back to index.html");

    // Built asset
    const script = /<script[^>]*src="(\/assets\/[^"]+\.js)"/.exec(home.body)?.[1];
    check(script !== undefined, "index.html references no /assets/*.js script");
    const asset = await http(/** @type {string} */ (script));
    check(asset.status === 200, `GET ${script} returned ${asset.status}`);
    check(asset.contentType.includes("javascript"), `GET ${script} content type is ${asset.contentType}`);
    log(`ok  GET ${script} serves JavaScript`);

    // API error comes from the back-end
    const api = await http("/api/v1/does-not-exist");
    check(api.status === 404, `GET /api/v1/does-not-exist returned ${api.status}`);
    check(api.contentType.includes("application/problem+json"), `API content type is ${api.contentType}`);
    check(JSON.parse(api.body).instance === "/api/v1/does-not-exist", "API problem has the wrong instance");
    log("ok  /api is proxied to the back-end");

    // Restart keeps the migration history
    const before = migrationHistory(run, database);
    check(before !== "", "the migration history is empty");
    mustRun(run, ["down"]);
    mustRun(run, ["up", ...WAIT]);
    const after = migrationHistory(run, database);
    check(after === before, `the migration history changed across a restart:\n${before}\n---\n${after}`);
    log("ok  the migration history survives a restart");
  } catch (error) {
    failed = true;
    log(`FAILED: ${error instanceof Error ? error.message : String(error)}`);
    log(run(["logs", "--no-color", "--tail", "200"]).stdout);
  } finally {
    const down = run(["down", "-v", "--remove-orphans"]);
    if (down.status !== 0) {
      failed = true;
      log(`FAILED: tear-down exited ${down.status}\n${down.stderr}`);
    }
  }
  log(failed ? "Smoke test failed." : "Smoke test passed.");
  return failed ? 1 : 0;
}

/** @param {number} ms */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** @returns {{ db: string, user: string }} */
function readDatabase() {
  const values = Object.fromEntries(
    readFileSync(ENV_EXAMPLE, "utf8")
      .split(/\r?\n/)
      .filter((line) => /^[A-Z_]+=/.test(line))
      .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
  );
  return { db: values.POSTGRES_DB, user: values.POSTGRES_USER };
}

async function main() {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !STACK_VARIABLE.test(key)));
  /** @type {Run} */
  const run = (args) => {
    const result = spawnSync("docker", ["compose", "-p", PROJECT, "--env-file", ENV_EXAMPLE, ...args], {
      cwd: ROOT,
      env: { ...env, WEB_PORT },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    });
    return { status: result.error ? -1 : result.status, stdout: result.stdout ?? "", stderr: result.stderr || (result.error?.message ?? "") };
  };
  /** @type {Pull} */
  const pull = (image) => {
    const result = spawnSync("docker", ["pull", "-q", image], { env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { status: result.error ? -1 : result.status, stdout: result.stdout ?? "", stderr: result.stderr || (result.error?.message ?? "") };
  };
  const config = JSON.parse(mustRun(run, ["config", "--format", "json"]));
  const images = externalImages(config, readDockerfiles(config));
  /** @type {Http} */
  const http = async (path) => {
    const response = await fetch(`http://localhost:${WEB_PORT}${path}`);
    return { status: response.status, contentType: response.headers.get("content-type") ?? "", body: await response.text() };
  };
  process.exit(await runSmoke(run, http, readDatabase(), console.log, { images, pull }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
