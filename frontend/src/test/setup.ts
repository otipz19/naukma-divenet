import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { resetSession } from "../api/session";
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

// Vitest 5 converts a jsdom FormData for Node's fetch, but with jsdom 30.1 it loses each file's
// bytes and name. Node's File and FormData go to fetch as they are, so multipart bodies arrive
// whole; jsdom's Blob stays, so its other conversions keep working.
if (typeof window !== "undefined") {
  // The app's tsconfig has no Node types, so the builtin is typed here by hand.
  const node = (
    globalThis as unknown as {
      process: { getBuiltinModule(id: "node:buffer"): { File: typeof File } };
    }
  ).process;
  const nodeFormData = (
    await new Response("a=1", {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }).formData()
  ).constructor as typeof FormData;
  Object.assign(globalThis, {
    File: node.getBuiltinModule("node:buffer").File,
    FormData: nodeFormData,
  });
}

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  cleanup();
  if (typeof window !== "undefined") localStorage.clear();
  server.resetHandlers();
  resetSession();
});
afterAll(() => server.close());
