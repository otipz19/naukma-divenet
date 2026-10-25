// Generated API types (src/api/schema.gen.ts) must match api/openapi.json.
// Usage: node scripts/check-api-types.mjs           check only; exits 1 when stale (gate step)
//        node scripts/check-api-types.mjs --write   regenerate the file
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import openapiTS, { COMMENT_HEADER, astToString } from "openapi-typescript";

export const REGENERATE_COMMAND = "pnpm --filter @divenet/frontend api:types";

const DEFAULT_PATHS = {
  spec: fileURLToPath(new URL("../../api/openapi.json", import.meta.url)),
  types: fileURLToPath(new URL("../src/api/schema.gen.ts", import.meta.url)),
};

/**
 * Generates the types source from an OpenAPI document, the same way the openapi-typescript CLI does.
 * @param {string} specPath
 * @returns {Promise<string>}
 */
export async function generateTypes(specPath) {
  const spec = JSON.parse(readFileSync(specPath, "utf8"));
  return `${COMMENT_HEADER}${astToString(await openapiTS(spec))}`;
}

/** @param {string} text */
function normalise(text) {
  return text.replace(/\r\n/g, "\n");
}

/**
 * Compares the committed types with fresh output. Never writes.
 * @param {{ spec: string, types: string }} paths
 * @returns {Promise<{ ok: boolean, message: string }>}
 */
export async function checkTypes(paths = DEFAULT_PATHS) {
  const expected = normalise(await generateTypes(paths.spec));
  let actual = null;
  try {
    actual = normalise(readFileSync(paths.types, "utf8"));
  } catch {
    // Missing file: reported as stale below.
  }
  return actual === expected
    ? { ok: true, message: "Generated API types match api/openapi.json." }
    : {
        ok: false,
        message: `Generated API types are stale or missing. Regenerate them with: ${REGENERATE_COMMAND}`,
      };
}

/**
 * Rewrites the generated types file.
 * @param {{ spec: string, types: string }} paths
 */
export async function writeTypes(paths = DEFAULT_PATHS) {
  writeFileSync(paths.types, await generateTypes(paths.spec));
}

async function main() {
  if (process.argv.includes("--write")) {
    await writeTypes();
    console.log("Wrote src/api/schema.gen.ts from api/openapi.json.");
    return;
  }
  const result = await checkTypes();
  if (!result.ok) {
    console.error(result.message);
    process.exit(1);
  }
  console.log(result.message);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
