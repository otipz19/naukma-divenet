// Runs the performance suite against a real compose stack (spec
// shared/performance): k6 load scenarios and the Lighthouse budget check.
// Starts the stack as the compose project `divenet-perf` on WEB_PORT 18082, so
// it never touches a developer's own stack, the smoke project or the E2E
// project, and always removes its containers, network and volumes.
// Usage: node scripts/run-perf.mjs   (or `pnpm test:perf`; exits 1 when a threshold or budget is crossed)
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { externalImages, readDockerfiles } from "./compose-rules.mjs";
import { PULL_WAITS_MS, pullImages } from "./smoke-stack.mjs";
import { composeCommands, mustRun, readEnv, STACK_VARIABLE, upAndWait, wait, waitUntilSeeded } from "./stack.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const ENV_EXAMPLE = join(ROOT, ".env.example");
export const PROJECT = "divenet-perf";
export const WEB_PORT = "18082";
// Fixed test-only credentials; the stack's admin bootstrap creates this account.
const ADMIN_EMAIL = "admin@perf.divenet.test";
const ADMIN_PASSWORD = "divenet-perf-admin";
// Design D5a: the pinned k6 image runs on the stack's network, so the suite
// measures the product, not the host's port-forward into it.
const K6_IMAGE = "grafana/k6:2.3.0";

/**
 * Starts an isolated stack, runs the performance suite against it, and always tears it down.
 * @param {(args: string[]) => { status: number, stdout: string, stderr: string }} run `docker compose` for this project
 * @param {(command: string, args: string[], options: object) => { status: number, stdout?: string }} spawn a check command
 * @param {(line: string) => void} log
 * @param {{ images?: string[], pull?: (image: string) => { status: number, stderr: string }, sleep?: (ms: number) => Promise<void> }} options
 * @returns {Promise<number>} the exit code
 */
export async function runPerf(run, spawn, log = console.log, options = {}) {
  const { images = [], pull = () => ({ status: 0, stderr: "" }), sleep = wait } = options;
  let failed = false;
  try {
    await pullImages([...images, K6_IMAGE], pull, sleep, log);

    log("Starting the stack (build, then wait until healthy)...");
    await upAndWait(run, log, sleep);
    log("ok  stack healthy");

    log("Waiting until the demo seed and the admin bootstrap are done...");
    await waitUntilSeeded(`http://localhost:${WEB_PORT}`, { adminEmail: ADMIN_EMAIL, adminPassword: ADMIN_PASSWORD }, sleep);
    log("ok  stack seeded");

    log("Running the k6 load scenarios (in the stack's network)...");
    const k6 = spawn(
      "docker",
      [
        "run",
        "--rm",
        "--network",
        `${PROJECT}_default`,
        "-v",
        `${join(ROOT, "perf", "scripts")}:/scripts`,
        K6_IMAGE,
        "run",
        "-e",
        "BASE_URL=http://web",
        "/scripts/load.js",
      ],
      { stdio: "inherit" },
    );
    if (k6.status !== 0) {
      failed = true;
      log("FAILED: the k6 load run crossed a threshold or could not start.");
    }

    log("Running the Lighthouse budget check...");
    const lighthouse = spawn(process.execPath, [join(ROOT, "perf", "scripts", "lighthouse.mjs"), `http://localhost:${WEB_PORT}`], {
      cwd: join(ROOT, "perf"),
      stdio: "inherit",
    });
    if (lighthouse.status !== 0) {
      failed = true;
      log("FAILED: the Lighthouse budget check crossed a budget.");
    }
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
  log(failed ? "Performance run failed." : "Performance run passed.");
  return failed ? 1 : 0;
}

async function main() {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !STACK_VARIABLE.test(key)));
  const { run, pull } = composeCommands({
    project: PROJECT,
    envFile: ENV_EXAMPLE,
    cwd: ROOT,
    env,
    vars: { WEB_PORT, ADMIN_EMAIL, ADMIN_PASSWORD },
  });
  const config = JSON.parse(mustRun(run, ["config", "--format", "json"]));
  const images = externalImages(config, readDockerfiles(config));
  /** @type {(command: string, args: string[], options: object) => { status: number }} */
  const spawn = (command, args, options) => {
    const result = spawnSync(command, args, { ...options, shell: process.platform === "win32", encoding: "buffer" });
    return { status: result.error ? -1 : (result.status ?? 1) };
  };
  process.exit(await runPerf(run, spawn, console.log, { images, pull, sleep: wait }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
