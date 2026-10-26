import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./server";

// jsdom has no matchMedia. This default matches no query: a light system theme and a viewport
// narrower than any `min-width` breakpoint. Tests that need a match pass their own media list.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    Object.assign(new EventTarget(), {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
    });
}

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  cleanup();
  if (typeof window !== "undefined") localStorage.clear();
  server.resetHandlers();
});
afterAll(() => server.close());
