// Tests for scripts/smoke-stack.mjs with fake runners, no Docker needed (scenario "Smoke test cleans up").
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runSmoke } from "./smoke-stack.mjs";

const INDEX = '<!doctype html><script type="module" src="/assets/index-abc.js"></script><div id="root"></div>';
const DATABASE = { db: "divenet", user: "divenet" };

/**
 * A fake `docker compose` that succeeds unless `fail` names the subcommand.
 * @param {string} [fail]
 */
function fakeRun(fail) {
  /** @type {string[][]} */
  const calls = [];
  /** @param {string[]} args */
  const run = (args) => {
    calls.push(args);
    if (args[0] === fail) return { status: 1, stdout: "", stderr: `${fail} failed` };
    if (args[0] === "ps") {
      const services = ["db", "backend", "web"].map((Service) => JSON.stringify({ Service, Health: "healthy" }));
      return { status: 0, stdout: services.join("\n"), stderr: "" };
    }
    if (args[0] === "exec") return { status: 0, stdout: "1|2026-10-26 08:00:00\n", stderr: "" };
    if (args[0] === "logs") return { status: 0, stdout: "backend-1 | log line", stderr: "" };
    return { status: 0, stdout: "", stderr: "" };
  };
  return { run, calls };
}

/** @param {Record<string, { status: number, contentType: string, body: string }>} overrides */
function fakeHttp(overrides = {}) {
  /** @type {Record<string, { status: number, contentType: string, body: string }>} */
  const responses = {
    "/": { status: 200, contentType: "text/html", body: INDEX },
    "/no-such-page": { status: 200, contentType: "text/html", body: INDEX },
    "/assets/index-abc.js": { status: 200, contentType: "application/javascript", body: "" },
    "/api/v1/does-not-exist": {
      status: 404,
      contentType: "application/problem+json",
      body: JSON.stringify({ status: 404, instance: "/api/v1/does-not-exist" }),
    },
    ...overrides,
  };
  return async (/** @type {string} */ path) => responses[path] ?? { status: 404, contentType: "text/html", body: "" };
}

/** @param {string[][]} calls */
const last = (calls) => calls[calls.length - 1];

describe("runSmoke", () => {
  it("passes, restarts without removing the volume, and tears down last", async () => {
    const { run, calls } = fakeRun();
    const lines = /** @type {string[]} */ ([]);
    assert.equal(await runSmoke(run, fakeHttp(), DATABASE, (line) => lines.push(line)), 0);
    assert.deepEqual(calls.map((args) => args[0]), ["up", "ps", "exec", "down", "up", "exec", "down"]);
    assert.deepEqual(calls[3], ["down"]);
    assert.deepEqual(last(calls), ["down", "-v", "--remove-orphans"]);
    assert.equal(lines.at(-1), "Smoke test passed.");
  });

  it("fails, prints the logs and still tears down when an HTTP check fails", async () => {
    const { run, calls } = fakeRun();
    const lines = /** @type {string[]} */ ([]);
    const http = fakeHttp({ "/api/v1/does-not-exist": { status: 502, contentType: "text/html", body: "" } });
    assert.equal(await runSmoke(run, http, DATABASE, (line) => lines.push(line)), 1);
    assert.ok(lines.some((line) => line.includes("returned 502")));
    assert.ok(lines.includes("backend-1 | log line"));
    assert.deepEqual(last(calls), ["down", "-v", "--remove-orphans"]);
  });

  it("fails and still tears down when the stack does not start", async () => {
    const { run, calls } = fakeRun("up");
    assert.equal(await runSmoke(run, fakeHttp(), DATABASE, () => {}), 1);
    assert.deepEqual(calls.map((args) => args[0]), ["up", "logs", "down"]);
    assert.deepEqual(last(calls), ["down", "-v", "--remove-orphans"]);
  });

  it("fails when a service is not healthy", async () => {
    const { run } = fakeRun();
    /** @param {string[]} args */
    const unhealthy = (args) =>
      args[0] === "ps"
        ? { status: 0, stdout: JSON.stringify([{ Service: "db", Health: "healthy" }, { Service: "backend", Health: "starting" }]), stderr: "" }
        : run(args);
    const lines = /** @type {string[]} */ ([]);
    assert.equal(await runSmoke(unhealthy, fakeHttp(), DATABASE, (line) => lines.push(line)), 1);
    assert.ok(lines.some((line) => line.includes("backend is starting, expected healthy")));
  });

  it("fails when the migration history changes across the restart", async () => {
    const { run } = fakeRun();
    let reads = 0;
    /** @param {string[]} args */
    const changing = (args) =>
      args[0] === "exec" ? { status: 0, stdout: `1|time-${reads++}`, stderr: "" } : run(args);
    assert.equal(await runSmoke(changing, fakeHttp(), DATABASE, () => {}), 1);
  });
});
