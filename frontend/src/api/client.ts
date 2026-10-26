import createClient, { type Client, type Middleware } from "openapi-fetch";
import { ApiError } from "./ApiError";
import { apiBaseUrl } from "./baseUrl";
import type { paths } from "./schema.gen";
import { accessToken, refreshSession } from "./session";

export { apiBaseUrl };

const throwApiErrors: Middleware = {
  async onResponse({ response }) {
    if (!response.ok) throw await ApiError.fromResponse(response);
    return undefined;
  },
  onError({ error }) {
    return error instanceof ApiError ? error : ApiError.network(error);
  },
};

// A 401 from these means wrong credentials or a dead session, never an expired access token.
const OPEN_AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];

function withAccessToken(request: Request): Request {
  const token = accessToken();
  if (!token) return request;
  const authorized = new Request(request);
  authorized.headers.set("Authorization", `Bearer ${token}`);
  return authorized;
}

/**
 * Sends the access token as a bearer header. On a 401 it refreshes the session once and retries
 * the call with the new token (spec auth "The web app keeps the session...").
 */
export async function authFetch(request: Request): Promise<Response> {
  const retry = request.clone();
  const response = await fetch(withAccessToken(request));
  const path = new URL(request.url).pathname.replace(/^\/api\/v1/, "");
  if (response.status !== 401 || OPEN_AUTH_PATHS.includes(path)) return response;
  if (!(await refreshSession())) return response;
  return fetch(withAccessToken(retry));
}

/** Creates a typed client whose failed calls reject with {@link ApiError}. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- same constraint as openapi-fetch
export function createApiClient<Paths extends {}>(baseUrl: string = apiBaseUrl()): Client<Paths> {
  const client = createClient<Paths>({ baseUrl, fetch: authFetch });
  client.use(throwApiErrors);
  return client;
}

/**
 * The client for the DiveNet API, typed from api/openapi.json. The contract's paths already start
 * with `/api/v1`, so its base is the bare origin; requests still go to the same-origin `/api/v1`.
 */
export const api = createApiClient<paths>(window.location.origin);
