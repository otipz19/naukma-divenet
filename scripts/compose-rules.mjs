// Rules for the rendered compose configuration (`docker compose config --format json`),
// used by the gate step scripts/check-compose.mjs and by scripts/smoke-stack.mjs.
// Pure functions apart from readDockerfiles, which reads files: no Docker needed.
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const SERVICES = ["db", "backend", "web"];
export const PUBLIC_SERVICE = "web";
export const DB_DATA_DIR = "/var/lib/postgresql/data";
// Each service must wait for these to be healthy (start order: db -> backend -> web).
const REQUIRED_DEPENDENCIES = { backend: "db", web: "backend" };

/**
 * Host ports a service publishes, from either the short ("8080:80") or the long form.
 * @param {any} service a service from the rendered configuration
 * @returns {string[]}
 */
export function publishedPorts(service) {
  return (service.ports ?? []).map((/** @type {any} */ port) => {
    if (typeof port === "object") return String(port.published ?? "");
    const parts = String(port).split("/")[0].split(":");
    return parts.length > 1 ? parts[parts.length - 2] : "";
  });
}

/**
 * True when an image reference names a version: a tag other than `latest`, or a digest.
 * @param {string} reference e.g. `postgis/postgis:17-3.5`
 */
export function isPinned(reference) {
  if (reference.includes("@sha256:")) return true;
  const name = reference.split("/").pop() ?? "";
  const colon = name.indexOf(":");
  if (colon < 0) return false;
  const tag = name.slice(colon + 1);
  return tag !== "" && tag !== "latest";
}

/**
 * Base images of a Dockerfile, skipping stages that build on an earlier stage.
 * @param {string} text Dockerfile contents
 * @returns {string[]}
 */
export function baseImages(text) {
  const stages = new Set();
  const images = [];
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*FROM\s+(?:--\S+\s+)*(\S+)(?:\s+AS\s+(\S+))?/i.exec(line);
    if (!match) continue;
    if (!stages.has(match[1].toLowerCase())) images.push(match[1]);
    if (match[2]) stages.add(match[2].toLowerCase());
  }
  return images;
}

/**
 * Dockerfile text by service name, for the services that have a `build` section.
 * A Dockerfile that cannot be read is left out (findComposeProblems reports it).
 * @param {any} config the rendered compose configuration
 * @returns {Record<string, string>}
 */
export function readDockerfiles(config) {
  /** @type {Record<string, string>} */
  const dockerfiles = {};
  for (const [name, service] of Object.entries(config.services ?? {})) {
    const build = /** @type {any} */ (service).build;
    if (!build) continue;
    try {
      dockerfiles[name] = readFileSync(join(build.context, build.dockerfile ?? "Dockerfile"), "utf8");
    } catch {
      // Reported as "Dockerfile not found" by findComposeProblems.
    }
  }
  return dockerfiles;
}

/**
 * Images the stack pulls from a registry: the image of each service without `build`, and
 * the `# syntax=` frontend and base images of each built service's Dockerfile. No duplicates,
 * in service order.
 * @param {any} config the rendered compose configuration
 * @param {Record<string, string>} dockerfiles Dockerfile text by service name
 * @returns {string[]}
 */
export function externalImages(config, dockerfiles) {
  const images = new Set();
  for (const [name, service] of Object.entries(config.services ?? {})) {
    const { build, image } = /** @type {any} */ (service);
    if (!build) {
      if (image) images.add(image);
    } else if (dockerfiles[name] !== undefined) {
      const syntax = syntaxImage(dockerfiles[name]);
      if (syntax) images.add(syntax);
      for (const base of baseImages(dockerfiles[name])) images.add(base);
    }
  }
  return [...images];
}

/**
 * The BuildKit frontend image named by a `# syntax=` directive, which must come before any
 * instruction; null when the Dockerfile has none.
 * @param {string} text Dockerfile contents
 * @returns {string | null}
 */
export function syntaxImage(text) {
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*#\s*syntax\s*=\s*(\S+)/i.exec(line);
    if (match) return match[1];
    if (line.trim() !== "" && !line.trim().startsWith("#")) return null;
  }
  return null;
}

/** @param {any} healthcheck */
function hasHealthcheck(healthcheck) {
  if (!healthcheck || healthcheck.disable) return false;
  const test = healthcheck.test;
  if (!test || test.length === 0) return false;
  return !(Array.isArray(test) && test[0] === "NONE");
}

/** @param {any} volume @param {Record<string, unknown>} named */
function isNamedDataVolume(volume, named) {
  if (typeof volume === "string") {
    const [source, target] = volume.split(":");
    return target === DB_DATA_DIR && source in named;
  }
  return volume.type === "volume" && volume.target === DB_DATA_DIR && volume.source in named;
}

/**
 * @param {any} config the rendered compose configuration
 * @param {Record<string, string>} dockerfiles Dockerfile text by service name, for services with `build`
 * @returns {string[]} one `<service or file>: <message>` string per problem
 */
export function findComposeProblems(config, dockerfiles = {}) {
  const services = config.services ?? {};
  const problems = [];

  for (const name of SERVICES) {
    if (!services[name]) problems.push(`${name}: service is missing`);
  }

  for (const [name, service] of Object.entries(services)) {
    if (!hasHealthcheck(service.healthcheck)) problems.push(`${name}: no health check`);

    for (const [dependency, options] of Object.entries(service.depends_on ?? {})) {
      const condition = /** @type {any} */ (options)?.condition;
      if (condition !== "service_healthy") {
        problems.push(`${name}: depends on ${dependency} with ${condition}, not service_healthy`);
      }
    }
    const required = REQUIRED_DEPENDENCIES[/** @type {keyof typeof REQUIRED_DEPENDENCIES} */ (name)];
    if (required && !service.depends_on?.[required]) {
      problems.push(`${name}: does not wait for ${required} to be healthy`);
    }

    const ports = publishedPorts(service);
    if (name === PUBLIC_SERVICE) {
      if (ports.length !== 1) problems.push(`${name}: publishes ${ports.length} ports, expected exactly 1`);
    } else if (ports.length > 0) {
      problems.push(`${name}: publishes a port (${ports.join(", ")}); only ${PUBLIC_SERVICE} may`);
    }

    if (service.image && !isPinned(service.image)) {
      problems.push(`${name}: image ${service.image} has no pinned version tag`);
    }
    if (service.build) {
      const dockerfile = dockerfiles[name];
      if (dockerfile === undefined) {
        problems.push(`${name}: Dockerfile not found`);
      } else {
        for (const image of baseImages(dockerfile)) {
          if (!isPinned(image)) problems.push(`${name} Dockerfile: FROM ${image} has no pinned version tag`);
        }
      }
    }
  }

  const db = services.db;
  if (db && !(db.volumes ?? []).some((/** @type {any} */ v) => isNamedDataVolume(v, config.volumes ?? {}))) {
    problems.push(`db: ${DB_DATA_DIR} is not on a named volume`);
  }
  return problems;
}
