import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { MIRA, authResponse } from "../test/auth";
import { refreshUrl, server } from "../test/server";
import { ApiError } from "./ApiError";
import { api, apiBaseUrl, createApiClient } from "./client";
import { getSession, signIn } from "./session";

// A contract of its own, so these tests do not depend on the real API's paths.
interface TestPaths {
  "/sites": {
    get: {
      parameters: { query?: never; header?: never; path?: never; cookie?: never };
      requestBody?: never;
      responses: {
        200: { headers: Record<string, unknown>; content: { "application/json": string[] } };
      };
    };
  };
}

const sitesUrl = `${window.location.origin}/api/v1/sites`;

async function failure(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
}

describe("shared/api-client: API calls go to the same-origin /api/v1 base", () => {
  it("sends the request to <app origin>/api/v1/sites", async () => {
    let requestedUrl = "";
    server.use(
      http.get(sitesUrl, ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json(["Blue Hole"]);
      }),
    );

    const { data } = await createApiClient<TestPaths>().GET("/sites");

    expect(apiBaseUrl()).toBe(`${window.location.origin}/api/v1`);
    expect(requestedUrl).toBe(sitesUrl);
    expect(data).toEqual(["Blue Hole"]);
  });
});

describe("shared/api-client: Error responses become one error type", () => {
  it("exposes the fields of a problem document", async () => {
    server.use(
      http.get(sitesUrl, () =>
        HttpResponse.json(
          {
            title: "Bad Request",
            status: 400,
            detail: "Invalid request content.",
            instance: "/api/v1/sites",
            errors: [{ field: "name", message: "must not be blank" }],
          },
          { status: 400, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    );

    const error = await failure(createApiClient<TestPaths>().GET("/sites"));

    expect(error.kind).toBe("http");
    expect(error.status).toBe(400);
    expect(error.problem).toEqual({
      title: "Bad Request",
      detail: "Invalid request content.",
      instance: "/api/v1/sites",
      errors: [{ field: "name", message: "must not be blank" }],
    });
  });

  it("has a status and no problem fields for a non-JSON body", async () => {
    server.use(
      http.get(sitesUrl, () =>
        HttpResponse.text("<html>Bad Gateway</html>", {
          status: 502,
          headers: { "Content-Type": "text/html" },
        }),
      ),
    );

    const error = await failure(createApiClient<TestPaths>().GET("/sites"));

    expect(error.kind).toBe("http");
    expect(error.status).toBe(502);
    expect(error.problem).toBeUndefined();
  });

  it("has no problem fields when a JSON body cannot be parsed", async () => {
    server.use(
      http.get(
        sitesUrl,
        () =>
          new HttpResponse("{not json", {
            status: 500,
            headers: { "Content-Type": "application/problem+json" },
          }),
      ),
    );

    const error = await failure(createApiClient<TestPaths>().GET("/sites"));

    expect(error.status).toBe(500);
    expect(error.problem).toBeUndefined();
  });
});

describe("shared/api-client: Network failures become the same error type", () => {
  it("marks an unreachable API as a network failure without a status", async () => {
    server.use(http.get(sitesUrl, () => HttpResponse.error()));

    const error = await failure(createApiClient<TestPaths>().GET("/sites"));

    expect(error.kind).toBe("network");
    expect(error.status).toBeUndefined();
  });
});

describe("auth: The web app keeps the session without storing the access token", () => {
  const meUrl = `${window.location.origin}/api/v1/auth/me`;
  const loginUrl = `${window.location.origin}/api/v1/auth/login`;

  it("renews an expired access token once and retries the call with the new token", async () => {
    signIn(authResponse("expired-token"));
    const seen: (string | null)[] = [];
    server.use(
      http.get(meUrl, ({ request }) => {
        const header = request.headers.get("Authorization");
        seen.push(header);
        return header === "Bearer fresh-token"
          ? HttpResponse.json(MIRA)
          : new HttpResponse(null, { status: 401 });
      }),
      http.post(refreshUrl(), () => HttpResponse.json(authResponse("fresh-token"))),
    );

    const { data } = await api.GET("/api/v1/auth/me");

    expect(data).toEqual(MIRA);
    expect(seen).toEqual(["Bearer expired-token", "Bearer fresh-token"]);
  });

  it("does not refresh after a 401 from the login endpoint", async () => {
    let refreshes = 0;
    server.use(
      http.post(loginUrl, () => new HttpResponse(null, { status: 401 })),
      http.post(refreshUrl(), () => {
        refreshes += 1;
        return new HttpResponse(null, { status: 401 });
      }),
    );

    const error = await failure(
      api.POST("/api/v1/auth/login", { body: { email: "a@b.c", password: "x" } }),
    );

    expect(error.status).toBe(401);
    expect(refreshes).toBe(0);
  });

  it("signs out and rejects when the refresh after a 401 fails", async () => {
    signIn(authResponse("expired-token"));
    server.use(http.get(meUrl, () => new HttpResponse(null, { status: 401 })));

    const error = await failure(api.GET("/api/v1/auth/me"));

    expect(error.status).toBe(401);
    expect(getSession().status).toBe("signedOut");
  });
});
