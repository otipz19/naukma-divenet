import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

/** The refresh endpoint as the app calls it on load; tests that need a session override it. */
export const refreshUrl = () => `${window.location.origin}/api/v1/auth/refresh`;

// A pattern, not refreshUrl(): this module also loads in the script tests, which have no window.
const ANY_ORIGIN_REFRESH = "*/api/v1/auth/refresh";

// `/` loads the map; by default it has no sites.
const ANY_ORIGIN_MARKERS = "*/api/v1/sites/markers";

// Every page load restores the session first. By default there is none, so pages render signed
// out; `server.resetHandlers()` keeps this handler. Other unhandled requests fail the test.
export const server = setupServer(
  http.post(ANY_ORIGIN_REFRESH, () =>
    HttpResponse.json(
      { status: 401, title: "Unauthorized" },
      { status: 401, headers: { "Content-Type": "application/problem+json" } },
    ),
  ),
  http.get(ANY_ORIGIN_MARKERS, () => HttpResponse.json([])),
  http.get("*/api/v1/sites/mine", () => HttpResponse.json([])),
  http.get("*/api/v1/countries", () => HttpResponse.json([])),
  http.get("*/api/v1/gear-items", () => HttpResponse.json([])),
);
