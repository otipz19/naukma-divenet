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

describe("runSmoke image pulls", () => {
  const IMAGES = ["postgis/postgis:17-3.5", "eclipse-temurin:25-jdk"];

  /**
   * A fake `docker pull` that fails the first `failures` attempts for `image`.
   * @param {string} image
   * @param {number} failures
   * @param {string[][]} calls shared with fakeRun, so the order of pulls and compose calls shows
   */
  function fakePull(image, failures, calls) {
    let left = failures;
    return (/** @type {string} */ name) => {
      calls.push(["pull", name]);
      if (name === image && left-- > 0) return { status: 1, stdout: "", stderr: "502 Bad Gateway" };
      return { status: 0, stdout: "", stderr: "" };
    };
  }

  it("retries a transient pull failure and goes on to start the stack", async () => {
    const { run, calls } = fakeRun();
    const waits = /** @type {number[]} */ ([]);
    const pull = fakePull("eclipse-temurin:25-jdk", 1, calls);
    const sleep = async (/** @type {number} */ ms) => void waits.push(ms);
    assert.equal(await runSmoke(run, fakeHttp(), DATABASE, () => {}, { images: IMAGES, pull, sleep }), 0);
    assert.deepEqual(calls.slice(0, 4).map((args) => args.join(" ")), [
      "pull postgis/postgis:17-3.5",
      "pull eclipse-temurin:25-jdk",
      "pull eclipse-temurin:25-jdk",
      "up --build --wait --wait-timeout 300",
    ]);
    assert.deepEqual(waits, [10_000]);
  });

  it("fails, names the image and tears down when a pull keeps failing", async () => {
    const { run, calls } = fakeRun();
    const lines = /** @type {string[]} */ ([]);
    const pull = fakePull("eclipse-temurin:25-jdk", 3, calls);
    const options = { images: IMAGES, pull, sleep: async () => {} };
    assert.equal(await runSmoke(run, fakeHttp(), DATABASE, (line) => lines.push(line), options), 1);
    assert.ok(lines.some((line) => line.includes("could not pull eclipse-temurin:25-jdk after 3 attempts")));
    assert.equal(calls.filter((args) => args[0] === "pull").length, 4);
    assert.ok(!calls.some((args) => args[0] === "up"));
    assert.deepEqual(last(calls), ["down", "-v", "--remove-orphans"]);
  });
});
