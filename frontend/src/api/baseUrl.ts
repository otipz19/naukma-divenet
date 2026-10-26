// Absolute but same-origin: the dev proxy and nginx both serve /api/v1 next to the app.
// (A relative base would break under Node's fetch in tests.)
export function apiBaseUrl(): string {
  return new URL("/api/v1", window.location.origin).href;
}
