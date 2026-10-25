// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { REGENERATE_COMMAND, checkTypes, writeTypes } from "./check-api-types.mjs";

/** @param {Record<string, unknown>} paths */
function spec(paths) {
  return JSON.stringify({ openapi: "3.1.0", info: { title: "T", version: "v1" }, paths });
}

const pingPath = {
  "/ping": {
    get: {
      responses: {
        200: { description: "OK", content: { "text/plain": { schema: { type: "string" } } } },
      },
    },
  },
};

/** @type {{ spec: string, types: string }} */
let paths;
/** @type {string} */
let dir;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "divenet-api-types-"));
  paths = { spec: join(dir, "openapi.json"), types: join(dir, "schema.gen.ts") };
  writeFileSync(paths.spec, spec({}));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("shared/api-contract: Generated front-end types match the snapshot", () => {
  it("passes when the types are current", async () => {
    await writeTypes(paths);

    expect((await checkTypes(paths)).ok).toBe(true);
  });

  it("fails when the snapshot changed, names the command and leaves the file unchanged", async () => {
    await writeTypes(paths);
    const before = readFileSync(paths.types, "utf8");
    writeFileSync(paths.spec, spec(pingPath));

    const result = await checkTypes(paths);

    expect(result.ok).toBe(false);
    expect(result.message).toContain(REGENERATE_COMMAND);
    expect(readFileSync(paths.types, "utf8")).toBe(before);
  });

  it("fails when the types file is missing", async () => {
    expect((await checkTypes(paths)).ok).toBe(false);
  });

  it("accepts CRLF line endings in the committed file", async () => {
    await writeTypes(paths);
    writeFileSync(paths.types, readFileSync(paths.types, "utf8").replace(/\n/g, "\r\n"));

    expect((await checkTypes(paths)).ok).toBe(true);
  });
});

describe("shared/api-contract: The types can be regenerated on request", () => {
  it("rewrites the file so a following check passes", async () => {
    await writeTypes(paths);
    writeFileSync(paths.spec, spec(pingPath));

    await writeTypes(paths);

    expect(readFileSync(paths.types, "utf8")).toContain('"/ping"');
    expect((await checkTypes(paths)).ok).toBe(true);
  });
});
