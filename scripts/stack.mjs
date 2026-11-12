// Shared plumbing for the scripts that run a throwaway compose stack: the
// compose command factory, the retrying `up --wait`, and the seed wait. Both
// `run-e2e.mjs` and `run-perf.mjs` use it so their behavior cannot drift.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

/** @param {number} ms @returns {Promise<void>} */
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Runs `run` once and returns its stdout, throwing the stderr on failure. */
export function mustRun(run, args) {
  const result = run(args);
  if (result.status !== 0) {
    throw new Error(`docker compose ${args.join(" ")} exited ${result.status}\n${result.stderr}`);
  }
  return result.stdout;
}

/** Reads the plain `KEY=value` pairs of an env file. */
export function readEnv(path) {
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((line) => /^[A-Z_]+=/.test(line))
      .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
  );
}

/** Environment variables that configure the stack and so must not leak from the host. */
export const STACK_VARIABLE = /^(POSTGRES_|WEB_PORT$|COMPOSE_|DB_|JWT_SECRET$|ADMIN_)/i;

/**
 * `docker compose` for one project: `run(args)` executes compose, `pull(image)` pulls one image.
 * @param {{ project: string, envFile: string, cwd: string, env: object, vars?: object }} config
 */
export function composeCommands({ project, envFile, cwd, env, vars = {} }) {
  /** @type {(args: string[]) => { status: number, stdout: string, stderr: string }} */
  const run = (args) => {
    const result = spawnSync("docker", ["compose", "-p", project, "--env-file", envFile, ...args], {
      cwd,
      env: { ...env, ...vars },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    });
    return {
      status: result.error ? -1 : result.status,
      stdout: result.stdout ?? "",
      stderr: result.stderr || (result.error?.message ?? ""),
    };
  };
  const pull = (image) => {
    const result = spawnSync("docker", ["pull", "-q", image], {
      env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return {
      status: result.error ? -1 : result.status,
      stdout: result.stdout ?? "",
      stderr: result.stderr || (result.error?.message ?? ""),
    };
  };
  return { run, pull };
}

/**
 * A cold stack seeds the demo data on first boot, which can outlast the backend
 * health check's budget on a slow machine; the health status is live, so
 * waiting again is enough. Three attempts, like the image pulls.
 */
export async function upAndWait(run, log, sleep, { waitTimeout = "300", attempts = 3 } = {}) {
  const WAIT = ["--wait", "--wait-timeout", waitTimeout];
  for (let attempt = 1; ; attempt++) {
    const failed = run(["up", "--build", ...WAIT]);
    if (failed.status === 0) return;
    if (attempt >= attempts) {
      throw new Error(`docker compose up exited ${failed.status}\n${failed.stderr}`);
    }
    log(`stack not healthy yet (attempt ${attempt} of ${attempts}); waiting and retrying...`);
    await sleep(15_000);
  }
}

/**
 * "Healthy" only means Tomcat answers: the demo seeders and the admin bootstrap
 * (Spring ApplicationRunners) keep running after that, and the admin is the last
 * account they create. Wait until the seeded catalog answers and the admin can
 * log in, because that is what the journeys and the load tests rely on.
 * @param {string} baseUrl the stack's public URL
 * @param {{ adminEmail: string, adminPassword: string }} credentials
 */
export async function waitUntilSeeded(baseUrl, { adminEmail, adminPassword }, sleep, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const markers = await (await fetch(`${baseUrl}/api/v1/sites/markers`)).json();
      const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      if (Array.isArray(markers) && markers.length >= 50 && login.status === 200) return;
    } catch {
      // The stack is still seeding; try again after the pause below.
    }
    await sleep(2_000);
  }
  throw new Error(`the stack did not finish seeding within ${timeoutMs / 1000} s`);
}
