import createClient, { type Client, type Middleware } from "openapi-fetch";
import { ApiError } from "./ApiError";
import type { paths } from "./schema.gen";

// Absolute but same-origin: the dev proxy and nginx both serve /api/v1 next to the app.
// (A relative base would break under Node's fetch in tests.)
export function apiBaseUrl(): string {
  return new URL("/api/v1", window.location.origin).href;
}

const throwApiErrors: Middleware = {
  async onResponse({ response }) {
    if (!response.ok) throw await ApiError.fromResponse(response);
    return undefined;
  },
  onError({ error }) {
    return error instanceof ApiError ? error : ApiError.network(error);
  },
};

/** Creates a typed client whose failed calls reject with {@link ApiError}. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- same constraint as openapi-fetch
export function createApiClient<Paths extends {}>(baseUrl: string = apiBaseUrl()): Client<Paths> {
  const client = createClient<Paths>({ baseUrl });
  client.use(throwApiErrors);
  return client;
}

/** The client for the DiveNet API, typed from api/openapi.json. */
export const api = createApiClient<paths>();
