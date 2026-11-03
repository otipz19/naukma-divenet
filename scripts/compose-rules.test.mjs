// Tests for scripts/compose-rules.mjs (spec shared/local-stack). Run: node --test "scripts/**/*.test.mjs"
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { baseImages, externalImages, findComposeProblems, findProfileProblems, isPinned, publishedPorts } from "./compose-rules.mjs";

const healthcheck = { test: ["CMD", "true"], interval: "10s" };
const BACKEND_DOCKERFILE = "FROM eclipse-temurin:25-jdk AS build\nRUN true\nFROM eclipse-temurin:25-jre\n";
const WEB_DOCKERFILE = "FROM node:24-alpine AS build\nFROM nginx:1.29-alpine\nCOPY --from=build /a /b\n";

/** The shape `docker compose config --format json` renders for compose.yaml. */
function rendered() {
  return {
    name: "divenet",
    services: {
      db: {
        image: "postgis/postgis:17-3.5",
        healthcheck,
        volumes: [{ type: "volume", source: "db-data", target: "/var/lib/postgresql/data", volume: {} }],
      },
      minio: {
        image: "cgr.dev/chainguard/minio@sha256:3c60a2a8c4d33409a9bc7a623a7fcbfb4605adc3d89422d2f53b3f673a6e5597",
        healthcheck,
        volumes: [{ type: "volume", source: "minio-data", target: "/data", volume: {} }],
      },
      backend: {
        build: { context: "/repo/backend", dockerfile: "Dockerfile" },
        depends_on: {
          db: { condition: "service_healthy", required: true },
          minio: { condition: "service_healthy", required: true },
        },
        environment: { MEDIA_STORAGE: "minio" },
        healthcheck,
      },
      web: {
        build: { context: "/repo", dockerfile: "frontend/Dockerfile" },
        depends_on: { backend: { condition: "service_healthy", required: true } },
        healthcheck,
        ports: [{ mode: "ingress", target: 80, published: "8080", protocol: "tcp" }],
      },
    },
    volumes: { "db-data": { name: "divenet_db-data" }, "minio-data": { name: "divenet_minio-data" } },
  };
}

const dockerfiles = { backend: BACKEND_DOCKERFILE, web: WEB_DOCKERFILE };

describe("findComposeProblems", () => {
  it("accepts the stack as rendered", () => {
    assert.deepEqual(findComposeProblems(rendered(), dockerfiles), []);
  });

  it("names a service without a health check (Gate rejects a broken configuration)", () => {
    const config = rendered();
    delete (/** @type {any} */ (config.services.backend).healthcheck);
    assert.deepEqual(findComposeProblems(config, dockerfiles), ["backend: no health check"]);
  });

  it("rejects a disabled health check", () => {
    const config = rendered();
    /** @type {any} */ (config.services.web).healthcheck = { disable: true };
    assert.deepEqual(findComposeProblems(config, dockerfiles), ["web: no health check"]);
  });

  it("rejects a dependency that does not wait for health (Start order follows health)", () => {
    const config = rendered();
    config.services.web.depends_on.backend.condition = "service_started";
    assert.deepEqual(findComposeProblems(config, dockerfiles), [
      "web: depends on backend with service_started, not service_healthy",
    ]);
  });

  it("rejects a missing start-order dependency", () => {
    const config = rendered();
    delete (/** @type {any} */ (config.services.backend).depends_on);
    assert.deepEqual(findComposeProblems(config, dockerfiles), [
      "backend: does not wait for db to be healthy",
      "backend: does not wait for minio to be healthy",
    ]);
  });

  it("rejects a port published by db, minio or backend (Published ports)", () => {
    const config = rendered();
    /** @type {any} */ (config.services.minio).ports = ["9000:9000"];
    /** @type {any} */ (config.services.db).ports = ["5432:5432"];
    /** @type {any} */ (config.services.backend).ports = [{ target: 8080, published: "8081" }];
    assert.deepEqual(findComposeProblems(config, dockerfiles), [
      "db: publishes a port (5432); only web may",
      "minio: publishes a port (9000); only web may",
      "backend: publishes a port (8081); only web may",
    ]);
  });

  it("rejects web publishing more than one port", () => {
    const config = rendered();
    config.services.web.ports.push({ mode: "ingress", target: 443, published: "8443", protocol: "tcp" });
    assert.deepEqual(findComposeProblems(config, dockerfiles), [
      "web: publishes 2 ports, expected exactly 1",
    ]);
  });

  it("rejects database data on a bind mount", () => {
    const config = rendered();
    config.services.db.volumes = [
      { type: "bind", source: "/repo/pgdata", target: "/var/lib/postgresql/data", volume: {} },
    ];
    assert.deepEqual(findComposeProblems(config, dockerfiles), [
      "db: /var/lib/postgresql/data is not on a named volume",
    ]);
  });

  it("requires MinIO data on a named volume (Media directory is on a named volume)", () => {
    const unmounted = rendered();
    delete (/** @type {any} */ (unmounted.services.minio).volumes);
    assert.deepEqual(findComposeProblems(unmounted, dockerfiles), ["minio: /data is not on a named volume"]);

    const bind = rendered();
    /** @type {any} */ (bind.services.minio).volumes = ["/repo/minio:/data"];
    assert.deepEqual(findComposeProblems(bind, dockerfiles), ["minio: /data is not on a named volume"]);

    const shortForm = rendered();
    /** @type {any} */ (shortForm.services.minio).volumes = ["minio-data:/data"];
    assert.deepEqual(findComposeProblems(shortForm, dockerfiles), []);
  });

  it("requires the back-end to keep media in MinIO", () => {
    const config = rendered();
    delete (/** @type {any} */ (config.services.backend).environment);
    assert.deepEqual(findComposeProblems(config, dockerfiles), [
      "backend: MEDIA_STORAGE must be minio, got undefined",
    ]);
  });

  it("names a missing minio service", () => {
    const config = rendered();
    delete (/** @type {any} */ (config.services).minio);
    delete (/** @type {any} */ (config.services.backend).depends_on).minio;
    assert.deepEqual(findComposeProblems(config, dockerfiles), [
      "minio: service is missing",
      "backend: does not wait for minio to be healthy",
    ]);
  });

  it("rejects unpinned images and names them (Unpinned image is rejected)", () => {
    const untagged = rendered();
    untagged.services.db.image = "postgis/postgis";
    assert.deepEqual(findComposeProblems(untagged, dockerfiles), [
      "db: image postgis/postgis has no pinned version tag",
    ]);

    const latest = rendered();
    latest.services.db.image = "postgis/postgis:latest";
    assert.deepEqual(findComposeProblems(latest, dockerfiles), [
      "db: image postgis/postgis:latest has no pinned version tag",
    ]);

    assert.deepEqual(
      findComposeProblems(rendered(), { ...dockerfiles, web: "FROM node AS build\nFROM nginx:1.29-alpine\n" }),
      ["web Dockerfile: FROM node has no pinned version tag"],
    );
  });

  it("names a missing service", () => {
    const config = rendered();
    delete (/** @type {any} */ (config.services).web);
    assert.deepEqual(findComposeProblems(config, dockerfiles), ["web: service is missing"]);
  });
});

describe("publishedPorts", () => {
  it("reads the short and the long form", () => {
    assert.deepEqual(publishedPorts({ ports: ["8080:80", "127.0.0.1:9090:80/tcp"] }), ["8080", "9090"]);
    assert.deepEqual(publishedPorts({ ports: [{ target: 80, published: "9090" }] }), ["9090"]);
    assert.deepEqual(publishedPorts({}), []);
  });
});

describe("isPinned and baseImages", () => {
  it("accepts tags and digests, rejects none and latest", () => {
    assert.equal(isPinned("nginx:1.29-alpine"), true);
    assert.equal(isPinned("registry.local:5000/team/app:2"), true);
    assert.equal(isPinned("nginx@sha256:abc"), true);
    assert.equal(isPinned("registry.local:5000/team/app"), false);
    assert.equal(isPinned("nginx:latest"), false);
  });

  it("skips stages built on an earlier stage", () => {
    assert.deepEqual(baseImages("FROM --platform=linux/amd64 node:24 AS deps\nFROM deps AS build\nFROM nginx:1.29\n"), [
      "node:24",
      "nginx:1.29",
    ]);
  });
});

describe("externalImages", () => {
  it("lists service images and Dockerfile base images, skipping stages", () => {
    assert.deepEqual(externalImages(rendered(), dockerfiles), [
      "postgis/postgis:17-3.5",
      "cgr.dev/chainguard/minio@sha256:3c60a2a8c4d33409a9bc7a623a7fcbfb4605adc3d89422d2f53b3f673a6e5597",
      "eclipse-temurin:25-jdk",
      "eclipse-temurin:25-jre",
      "node:24-alpine",
      "nginx:1.29-alpine",
    ]);
  });

  it("lists the # syntax= frontend image before the base images", () => {
    const config = { services: { app: { build: { context: "/repo" } } } };
    const text = "# syntax=docker/dockerfile:1\n# A comment.\nFROM nginx:1.29-alpine\n";
    assert.deepEqual(externalImages(config, { app: text }), ["docker/dockerfile:1", "nginx:1.29-alpine"]);
  });

  it("ignores a syntax comment after the first instruction", () => {
    const config = { services: { app: { build: { context: "/repo" } } } };
    const text = "FROM nginx:1.29-alpine\n# syntax=docker/dockerfile:1\n";
    assert.deepEqual(externalImages(config, { app: text }), ["nginx:1.29-alpine"]);
  });

  it("skips a FROM that names an earlier stage", () => {
    const config = { services: { app: { build: { context: "/repo" } } } };
    const text = "FROM node:24-alpine AS deps\nFROM deps AS build\nFROM nginx:1.29-alpine\n";
    assert.deepEqual(externalImages(config, { app: text }), ["node:24-alpine", "nginx:1.29-alpine"]);
  });

  it("lists an image shared by two services once", () => {
    const config = { services: { a: { image: "redis:8.2" }, b: { image: "redis:8.2" }, c: { build: {} } } };
    assert.deepEqual(externalImages(config, { c: "FROM redis:8.2\n" }), ["redis:8.2"]);
  });
});

describe("findProfileProblems", () => {
  it("accepts the demo default and an override", () => {
    assert.deepEqual(findProfileProblems("demo", "prod"), []);
  });

  it("reports a missing default", () => {
    assert.match(findProfileProblems(undefined, "prod")[0], /default to demo/);
  });

  it("reports an ignored override", () => {
    assert.match(findProfileProblems("demo", "demo")[0], /follow the env/);
  });
});
