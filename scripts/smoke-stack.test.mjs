// Tests for scripts/smoke-stack.mjs with fake runners, no Docker needed (scenario "Smoke test cleans up").
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { multipartFile, paddedJpeg, runSmoke, UPLOAD_LIMIT_BYTES } from "./smoke-stack.mjs";

const INDEX = '<!doctype html><script type="module" src="/assets/index-abc.js"></script><div id="root"></div>';
const DATABASE = { db: "divenet", user: "divenet" };
const MEDIA = "/media/3fa85f64-5717-4562-b3fc-2c963f66afa6";

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

/**
 * A fake web port. Responses are keyed by path for GET and by `METHOD path` otherwise; every
 * request is recorded in `requests`.
 * @param {Record<string, { status: number, contentType: string, body: string }>} overrides
 */
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
    "/media/00000000-0000-0000-0000-000000000000": { status: 404, contentType: "application/problem+json", body: "{}" },
    "POST /api/v1/auth/register": { status: 201, contentType: "application/json", body: "{}" },
    "POST /api/v1/auth/login": { status: 200, contentType: "application/json", body: '{"accessToken":"token-1"}' },
    "POST /api/v1/media": {
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ url: MEDIA, thumbnailUrl: `${MEDIA}/thumb` }),
    },
    [MEDIA]: { status: 200, contentType: "image/jpeg", body: "" },
    [`${MEDIA}/thumb`]: { status: 200, contentType: "image/jpeg", body: "" },
    ...overrides,
  };
  /** @type {{ path: string, init: any }[]} */
  const requests = [];
  /** @param {string} path @param {any} [init] */
  const http = async (path, init = {}) => {
    requests.push({ path, init });
    const key = init.method && init.method !== "GET" ? `${init.method} ${path}` : path;
    return responses[key] ?? { status: 404, contentType: "text/html", body: "" };
  };
  return Object.assign(http, { requests });
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

describe("runSmoke media checks", () => {
  it("uploads a file of exactly the limit with the access token from the login", async () => {
    const { run } = fakeRun();
    const http = fakeHttp();
    assert.equal(await runSmoke(run, http, DATABASE, () => {}), 0);
    const upload = http.requests.find((r) => r.path === "/api/v1/media");
    assert.equal(upload?.init.headers.Authorization, "Bearer token-1");
    assert.match(upload?.init.headers["Content-Type"], /^multipart\/form-data; boundary=/);
    assert.ok(upload?.init.body.length > UPLOAD_LIMIT_BYTES);
  });

  it("fails when /media is not proxied to the back-end (Media error comes from the back-end)", async () => {
    const { run, calls } = fakeRun();
    const lines = /** @type {string[]} */ ([]);
    const http = fakeHttp({
      "/media/00000000-0000-0000-0000-000000000000": { status: 200, contentType: "text/html", body: INDEX },
    });
    assert.equal(await runSmoke(run, http, DATABASE, (line) => lines.push(line)), 1);
    assert.ok(lines.some((line) => line.includes("/media/00000000-0000-0000-0000-000000000000 returned 200")));
    assert.deepEqual(last(calls), ["down", "-v", "--remove-orphans"]);
  });

  it("fails when the web server refuses an upload at the limit", async () => {
    const { run } = fakeRun();
    const lines = /** @type {string[]} */ ([]);
    const http = fakeHttp({ "POST /api/v1/media": { status: 413, contentType: "text/html", body: "" } });
    assert.equal(await runSmoke(run, http, DATABASE, (line) => lines.push(line)), 1);
    assert.ok(lines.some((line) => line.includes(`with ${UPLOAD_LIMIT_BYTES} bytes returned 413`)));
  });

  it("fails when an upload is gone after the restart (Restart keeps an upload)", async () => {
    const { run } = fakeRun();
    const base = fakeHttp();
    let thumbnailReads = 0;
    /** @param {string} path @param {any} [init] */
    const http = async (path, init) => {
      if (path === `${MEDIA}/thumb` && ++thumbnailReads > 1) return { status: 404, contentType: "", body: "" };
      return base(path, init);
    };
    const lines = /** @type {string[]} */ ([]);
    assert.equal(await runSmoke(run, http, DATABASE, (line) => lines.push(line)), 1);
    assert.ok(lines.some((line) => line.includes(`GET ${MEDIA}/thumb returned 404`)));
    assert.ok(lines.some((line) => line.includes("survives a restart")));
  });
});

describe("paddedJpeg", () => {
  it("is a JPEG of exactly the requested size", () => {
    const bytes = paddedJpeg(UPLOAD_LIMIT_BYTES);
    assert.equal(bytes.length, UPLOAD_LIMIT_BYTES);
    assert.deepEqual([...bytes.subarray(0, 3)], [0xff, 0xd8, 0xff]);
    const end = Buffer.from(bytes).indexOf(Buffer.from([0xff, 0xd9]));
    assert.ok(end > 0 && bytes.subarray(end + 2).every((b) => b === 0));
  });

  it("refuses a size smaller than the image", () => {
    assert.throws(() => paddedJpeg(10), /at least/);
  });
});

describe("multipartFile", () => {
  it("frames one file part with CRLF line ends", () => {
    const form = multipartFile("file", "a.jpg", "image/jpeg", new Uint8Array([1, 2]));
    const boundary = form.contentType.split("boundary=")[1];
    const text = Buffer.from(form.body).toString("latin1");
    assert.equal(
      text,
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="a.jpg"\r\n` +
        `Content-Type: image/jpeg\r\n\r\n\u0001\u0002\r\n--${boundary}--\r\n`,
    );
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
