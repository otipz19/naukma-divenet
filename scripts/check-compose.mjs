// Compose configuration check (gate step; spec shared/local-stack). Renders compose.yaml with
// `docker compose config` and checks the rules in compose-rules.mjs, that a missing database
// password or JWT key is refused, that the auth settings reach the back-end, and that WEB_PORT
// sets the published port. Builds and starts nothing.
// Usage: node scripts/check-compose.mjs   (exits 1 and lists each problem)
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PUBLIC_SERVICE, findComposeProblems, publishedPorts, readDockerfiles } from "./compose-rules.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const ENV_EXAMPLE = join(ROOT, ".env.example");
// Variables the stack reads; the caller's own values must not hide a problem.
const STACK_VARIABLE = /^(POSTGRES_|WEB_PORT$|COMPOSE_|DB_|JWT_SECRET$|ADMIN_)/i;
// Compose must refuse to render without these rather than fall back to a built-in value.
const REQUIRED_VARIABLES = ["POSTGRES_PASSWORD", "JWT_SECRET"];
const AUTH_VARIABLES = ["JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD"];

/**
 * Runs `docker compose config` from the repository root with a scrubbed environment.
 * @param {string} envFile
 * @param {Record<string, string>} extraEnv
 */
function renderConfig(envFile, extraEnv = {}) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !STACK_VARIABLE.test(key)));
  return spawnSync("docker", ["compose", "--env-file", envFile, "config", "--format", "json"], {
    cwd: ROOT,
    env: { ...env, ...extraEnv },
    encoding: "utf8",
  });
}

function main() {
  const problems = [];

  const example = renderConfig(ENV_EXAMPLE);
  if (example.error || example.status !== 0) {
    console.error(`docker compose config failed with .env.example:\n${example.error?.message ?? example.stderr}`);
    process.exit(1);
  }
  const config = JSON.parse(example.stdout);
  problems.push(...findComposeProblems(config, readDockerfiles(config)));

  // Scenarios "Missing password is rejected" and "Missing JWT key is rejected".
  const dir = mkdtempSync(join(tmpdir(), "divenet-compose-"));
  try {
    const lines = readFileSync(ENV_EXAMPLE, "utf8").split(/\r?\n/);
    for (const variable of REQUIRED_VARIABLES) {
      const envFile = join(dir, `no-${variable}.env`);
      writeFileSync(envFile, lines.filter((line) => !line.startsWith(`${variable}=`)).join("\n"));
      const missing = renderConfig(envFile);
      if (missing.status === 0) {
        problems.push(`compose.yaml: renders without ${variable}; it must refuse to`);
      } else if (!missing.stderr.includes(variable)) {
        problems.push(`compose.yaml: the error for a missing ${variable} does not name it: ${missing.stderr.trim()}`);
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  // Scenario "Auth settings reach the back-end".
  const backendEnv = config.services.backend?.environment ?? {};
  for (const variable of AUTH_VARIABLES) {
    if (!(variable in backendEnv)) problems.push(`backend: environment has no ${variable}`);
  }

  // Scenario "Web port is configurable".
  const custom = renderConfig(ENV_EXAMPLE, { WEB_PORT: "9090" });
  const ports = custom.status === 0 ? publishedPorts(JSON.parse(custom.stdout).services[PUBLIC_SERVICE] ?? {}) : [];
  if (ports.join() !== "9090") {
    problems.push(`${PUBLIC_SERVICE}: WEB_PORT=9090 publishes [${ports.join(", ")}], expected [9090]`);
  }

  if (problems.length > 0) {
    console.error(`Compose configuration has ${problems.length} problems:`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log("Compose configuration: services, health checks, ports, volume, pinned images and env handling are OK.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
