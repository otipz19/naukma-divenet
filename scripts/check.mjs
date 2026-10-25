// Single quality gate for the repository: `pnpm check`.
// Runs every step in order and exits non-zero on the first failure.
// Steps are check-only: no formatting fixes, no installs, no servers.
// Milestone M0 adds the backend (`backend/mvnw verify`) and frontend steps here.
import { spawnSync } from "node:child_process";

// Step arguments are fixed strings below, never user input, so joining them for the shell is safe.
// A shell is used so Windows resolves `.cmd` shims (pnpm bins, mvnw.cmd).
const steps = [
  { name: "openspec: validate specs and changes", cmd: "openspec", args: ["validate", "--all", "--strict", "--no-interactive"] },
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
