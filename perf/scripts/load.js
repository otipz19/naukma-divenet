// k6 load suite for DiveNet (spec shared/performance). Four scenarios mirror
// how the product is used: the map's site search, one site's full details,
// the global feed, and signing in. Each runs a steady ramping-vus profile and
// has its own p95 and error-rate thresholds; any crossed threshold fails the run.
//
// Run it yourself against a running stack:
//   k6 run -e BASE_URL=http://localhost:8080 perf/scripts/load.js
import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL ?? "http://localhost:18082";
// A seeded site (Osprey Reef) and a seeded diver, from the demo profile.
const SITE_ID = __ENV.SITE_ID ?? "1";
const LOGIN_EMAIL = __ENV.LOGIN_EMAIL ?? "sofia@demo.divenet.test";
const LOGIN_PASSWORD = __ENV.LOGIN_PASSWORD ?? "divenet-demo";

// Design D2/D3: generous course-product budgets, not production SLAs; ~20 VUs
// held for a minute, so the answer is "does it hold up", not "how fast is one call".
// The p95 budgets were calibrated with all four scenarios running concurrently
// (80 VUs total): login is bcrypt-dominated and needs the most headroom.
const PROFILE = {
  executor: "ramping-vus",
  startVUs: 0,
  stages: [
    { duration: "30s", target: 20 },
    { duration: "60s", target: 20 },
    { duration: "15s", target: 0 },
  ],
  gracefulRampDown: "10s",
};

export const options = {
  scenarios: {
    "site-search": { ...PROFILE, exec: "siteSearch" },
    "site-details": { ...PROFILE, exec: "siteDetails" },
    feed: { ...PROFILE, exec: "feed" },
    login: { ...PROFILE, exec: "login" },
  },
  thresholds: {
    "http_req_duration{scenario:site-search}": ["p(95)<800"],
    "http_req_duration{scenario:site-details}": ["p(95)<600"],
    "http_req_duration{scenario:feed}": ["p(95)<800"],
    "http_req_duration{scenario:login}": ["p(95)<1500"],
    "http_req_failed{scenario:site-search}": ["rate<0.01"],
    "http_req_failed{scenario:site-details}": ["rate<0.01"],
    "http_req_failed{scenario:feed}": ["rate<0.01"],
    "http_req_failed{scenario:login}": ["rate<0.01"],
  },
};

/** The map's search: every visitor filters the catalog this way. */
export function siteSearch() {
  const response = http.get(`${BASE_URL}/api/v1/sites/markers?q=os`);
  check(response, { "markers answer 200": (r) => r.status === 200 });
}

/** A site page's read model: details plus its reviews and warnings. */
export function siteDetails() {
  const details = http.get(`${BASE_URL}/api/v1/sites/${SITE_ID}`);
  check(details, { "site details answer 200": (r) => r.status === 200 });
  const reviews = http.get(`${BASE_URL}/api/v1/sites/${SITE_ID}/reviews`);
  check(reviews, { "reviews answer 200": (r) => r.status === 200 });
  const warnings = http.get(`${BASE_URL}/api/v1/sites/${SITE_ID}/warnings`);
  check(warnings, { "warnings answer 200": (r) => r.status === 200 });
}

/** The feed page's first page of posts. */
export function feed() {
  const response = http.get(`${BASE_URL}/api/v1/posts`);
  check(response, { "feed answers 200": (r) => r.status === 200 });
}

/** The sign-in path; bcrypt dominates its cost. */
export function login() {
  const response = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASSWORD }),
    { headers: { "Content-Type": "application/json" } },
  );
  check(response, { "login answers 200": (r) => r.status === 200 });
}
