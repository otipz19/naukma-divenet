// Single quality gate for the repository: `pnpm check`.
// Runs every step in order and exits non-zero on the first failure.
// Steps are check-only: no formatting fixes, no installs, no servers.
// Front-end steps need only Node; they run first so they fail fast.
// The compose and back-end steps need a running Docker daemon; the back-end also needs JDK 25+.
import { spawnSync } from "node:child_process";

// Explicit relative paths: cmd.exe may be configured not to search the current directory.
const mvnw = process.platform === "win32" ? ".\\mvnw.cmd" : "./mvnw";

/**
 * @param {string} name step label
 * @param {string} script a script from frontend/package.json
 */
const frontend = (name, script) => ({
  name: `frontend: ${name}`,
  cmd: "pnpm",
  args: ["--filter", "@divenet/frontend", "run", script],
});

// Step arguments are fixed strings below, never user input, so joining them for the shell is safe.
// A shell is used so Windows resolves `.cmd` shims (pnpm bins, mvnw.cmd).
const steps = [
  { name: "openspec: validate specs and changes", cmd: "openspec", args: ["validate", "--all", "--strict", "--no-interactive"] },
  { name: "design: tokens.css matches tokens.json", cmd: "node", args: ["design/build-tokens.mjs", "--check"] },
  { name: "scripts: unit tests", cmd: "node", args: ["--test", '"scripts/**/*.test.mjs"'] },
  // Renders compose.yaml without building: services, health checks, ports, volume, pinned images, env.
  { name: "compose: configuration", cmd: "node", args: ["scripts/check-compose.mjs"] },
  frontend("i18n key parity", "i18n:check"),
  // Literal colours, px lengths other than 1-2px hairlines and redefined tokens (docs/DESIGN.md rule 1).
  frontend("tokens-only CSS", "css:check"),
  frontend("API types match api/openapi.json", "api:types:check"),
  frontend("typecheck", "typecheck"),
  // Includes the ban on hard-coded JSX text (i18next/no-literal-string).
  frontend("lint", "lint"),
  frontend("format check", "format:check"),
  frontend("unit tests", "test"),
  frontend("production build", "build"),
  // The build carries the design tokens and self-hosted fonts, and no third-party font host.
  frontend("build output", "build:check"),
  // Compile, unit + integration tests, ArchUnit layer rules, OpenAPI snapshot check, Spotless check.
  { name: "backend: mvnw verify", cmd: mvnw, args: ["-B", "-ntp", "verify"], cwd: "backend" },
];

for (const step of steps) {
  console.log(`\n> ${step.name}`);
  const result = spawnSync([step.cmd, ...step.args].join(" "), {
    cwd: step.cwd ?? process.cwd(),
    stdio: "inherit",
    shell: true,
  });
  if (result.error || result.status !== 0) {
    console.error(`\nFAILED: ${step.name}${result.error ? ` (${result.error.message})` : ""}`);
    process.exit(result.status || 1);
  }
}
console.log("\nAll checks passed.");
