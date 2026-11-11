// Runs the Playwright E2E suite against a real compose stack (spec shared/e2e).
// Starts the stack as the compose project `divenet-e2e` on WEB_PORT 18081, so it
// never touches a developer's own stack or the smoke test's project, runs the
// journeys, and always removes its containers, network and volumes. The admin
// the journeys log in as is created from fixed test credentials passed to the
// stack, so nothing real is committed.
// Usage: node scripts/run-e2e.mjs   (or `pnpm test:e2e`; exits 1 when the suite fails)
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { externalImages, readDockerfiles } from "./compose-rules.mjs";
import { PULL_WAITS_MS, pullImages } from "./smoke-stack.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const ENV_EXAMPLE = join(ROOT, ".env.example");
export const PROJECT = "divenet-e2e";
export const WEB_PORT = "18081";
const WAIT = ["--wait", "--wait-timeout", "300"];
const STACK_VARIABLE = /^(POSTGRES_|WEB_PORT$|COMPOSE_|DB_|JWT_SECRET$|ADMIN_)/i;
// Fixed test-only credentials; the stack's admin bootstrap creates this account.
const ADMIN_EMAIL = "admin@e2e.divenet.test";
const ADMIN_PASSWORD = "divenet-e2e-admin";

/** @param {(args: string[]) => { status: number, stdout: string, stderr: string }} run */
function mustRun(run, args) {
  const result = run(args);
  if (result.status !== 0) {
    throw new Error(`docker compose ${args.join(" ")} exited ${result.status}\n${result.stderr}`);
  }
  return result.stdout;
}

/** Reads the plain `KEY=value` pairs of .env.example. */
function readEnvExample() {
  return Object.fromEntries(
    readFileSync(ENV_EXAMPLE, "utf8")
      .split(/\r?\n/)
      .filter((line) => /^[A-Z_]+=/.test(line))
      .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
  );
}

/** @param {(ms: number) => Promise<void>} sleep */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Starts an isolated stack, runs the E2E suite against it, and always tears it down.
 * @param {(args: string[]) => { status: number, stdout: string, stderr: string }} run `docker compose` for this project
 * @param {(command: string, args: string[], options: object) => { status: number }} spawn the test command
 * @param {(line: string) => void} log
 * @param {{ images?: string[], pull?: (image: string) => { status: number, stderr: string }, sleep?: (ms: number) => Promise<void> }} options
 * @returns {Promise<number>} the exit code
 */
export async function runE2E(run, spawn, log = console.log, options = {}) {
  const { images = [], pull = () => ({ status: 0, stderr: "" }), sleep = wait } = options;
  let failed = false;
  try {
    await pullImages(images, pull, sleep, log);

    log("Starting the stack (build, then wait until healthy)...");
    mustRun(run, ["up", "--build", ...WAIT]);
    log("ok  stack healthy");

    log("Running the E2E suite...");
    // Playwright's own CLI, run with the current Node: no shell, no pnpm shim, works everywhere.
    const test = spawn(process.execPath, [join(ROOT, "e2e", "node_modules", "@playwright", "test", "cli.js"), "test"], {
      cwd: join(ROOT, "e2e"),
      stdio: "inherit",
      env: {
        ...process.env,
        DIVENET_E2E_BASE_URL: `http://localhost:${WEB_PORT}`,
        DIVENET_E2E_ADMIN_EMAIL: ADMIN_EMAIL,
        DIVENET_E2E_ADMIN_PASSWORD: ADMIN_PASSWORD,
      },
    });
    if (test.status !== 0) failed = true;
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
  log(failed ? "E2E run failed." : "E2E run passed.");
  return failed ? 1 : 0;
}

async function main() {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !STACK_VARIABLE.test(key)));
  /** @type {(args: string[]) => { status: number, stdout: string, stderr: string }} */
  const run = (args) => {
    const result = spawnSync("docker", ["compose", "-p", PROJECT, "--env-file", ENV_EXAMPLE, ...args], {
      cwd: ROOT,
      env: { ...env, WEB_PORT, ADMIN_EMAIL, ADMIN_PASSWORD },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    });
    return { status: result.error ? -1 : result.status, stdout: result.stdout ?? "", stderr: result.stderr || (result.error?.message ?? "") };
  };
  const pull = (image) => {
    const result = spawnSync("docker", ["pull", "-q", image], { env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { status: result.error ? -1 : result.status, stdout: result.stdout ?? "", stderr: result.stderr || (result.error?.message ?? "") };
  };
  const config = JSON.parse(mustRun(run, ["config", "--format", "json"]));
  const images = externalImages(config, readDockerfiles(config));
  /** @type {(command: string, args: string[], options: object) => { status: number }} */
  const spawn = (command, args, options) => {
    const result = spawnSync(command, args, { ...options, shell: process.platform === "win32" });
    return { status: result.error ? -1 : (result.status ?? 1) };
  };
  process.exit(await runE2E(run, spawn, console.log, { images, pull, sleep: wait }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
