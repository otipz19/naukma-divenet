// Lighthouse budget check for the DiveNet SPA (spec shared/performance,
// design D4). Runs against the stack's own web server, because that is the
// thing a visitor gets: `/` and one seeded site page. A crossed budget
// (first contentful paint, largest contentful paint, total page weight)
// fails the run and names the budget.
//
// Usage: node scripts/lighthouse.mjs [baseUrl]
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse/core/index.js";

/** A Chrome the local machine surely has: CHROME_PATH, a system install, or
 * the Playwright cache (the E2E suite already downloads Chromium). */
function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const candidates = [];
  const programDirs = [
    process.env.ProgramFiles ?? "C:/Program Files",
    process.env["ProgramFiles(x86)"] ?? "C:/Program Files (x86)",
  ];
  for (const programDir of programDirs) {
    candidates.push(join(programDir, "Google", "Chrome", "Application", "chrome.exe"));
    const edge = join(programDir, "Microsoft", "Edge", "Application");
    if (existsSync(edge)) {
      for (const entry of readdirSync(edge)) {
        const candidate = join(edge, entry, "msedge.exe");
        if (existsSync(candidate)) candidates.push(candidate);
      }
    }
  }
  // The Playwright cache: %LOCALAPPDATA% on Windows, ~/.cache on Linux (CI).
  const cache = process.env.LOCALAPPDATA
    ? join(process.env.LOCALAPPDATA, "ms-playwright")
    : process.env.HOME
      ? join(process.env.HOME, ".cache", "ms-playwright")
      : null;
  if (cache && existsSync(cache)) {
    for (const entry of readdirSync(cache)) {
      if (!entry.startsWith("chromium")) continue;
      // Chrome-for-Testing builds (current Playwright) use -win64/-linux64.
      for (const sub of ["chrome-win64", "chrome-win", "chrome-linux64", "chrome-linux"]) {
        const executable = sub.startsWith("chrome-win") ? "chrome.exe" : "chrome";
        const candidate = join(cache, entry, sub, executable);
        if (existsSync(candidate)) candidates.push(candidate);
      }
    }
  }
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    process.stdout.write(
      "No Chrome, Edge or Playwright Chromium found. Set CHROME_PATH to a browser executable.\n",
    );
    process.exit(1);
  }
  return found;
}

// The pages measured: the landing map and one site's page (the demo seed's site id 1).
const BASE_URL = process.argv[2] ?? "http://localhost:18082";
const PAGES = ["/", "/sites/1"];

// Design D4 budgets, calibrated with Lighthouse's default 4x CPU throttling
// in the Docker-VM dev setup (FCP 2.6 s, LCP 4.7 s measured). TBT is
// deliberately excluded: it depends on the host's CPU speed, so a shared CI
// runner fails a budget local runs keep.
const BUDGETS = {
  "first-contentful-paint": { value: 3000, label: "first contentful paint" },
  "largest-contentful-paint": { value: 5000, label: "largest contentful paint" },
  "total-byte-weight": { value: 1_500_000, label: "total page weight" },
};

const chrome = await launch({ chromePath: findChrome(), chromeFlags: ["--headless=new"] });
try {
  let failed = false;
  for (const page of PAGES) {
    const url = `${BASE_URL}${page}`;
    process.stdout.write(`Lighthouse on ${url}...\n`);
    const result = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      onlyCategories: ["performance"],
      quiet: true,
    });
    const audits = result.lhr.audits;
    const fcp = audits["first-contentful-paint"].numericValue;
    const lcp = audits["largest-contentful-paint"].numericValue;
    const weight = audits["total-byte-weight"]?.numericValue;
    process.stdout.write(`  first contentful paint: ${(fcp / 1000).toFixed(2)} s\n`);
    process.stdout.write(`  largest contentful paint: ${(lcp / 1000).toFixed(2)} s\n`);
    if (weight != null) process.stdout.write(`  total page weight: ${(weight / 1000).toFixed(0)} kB\n`);

    for (const [key, budget] of Object.entries(BUDGETS)) {
      const measured = key === "total-byte-weight" ? weight : audits[key].numericValue;
      if (measured == null) {
        process.stdout.write(`  FAILED: Lighthouse reported no measurement for ${budget.label}\n`);
        failed = true;
        continue;
      }
      if (measured > budget.value) {
        process.stdout.write(
          `  FAILED: ${budget.label} ${(measured / 1000).toFixed(1)} crossed its ${(budget.value / 1000).toFixed(1)} budget\n`,
        );
        failed = true;
      }
    }
  }
  process.stdout.write(failed ? "Lighthouse budget failed.\n" : "Lighthouse budget passed.\n");
  process.exit(failed ? 1 : 0);
} finally {
  await chrome.kill();
}
