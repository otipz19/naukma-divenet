import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { ApiError } from "../api/ApiError";
import { apiBaseUrl } from "../api/client";
import { server } from "../test/server";
import { createQueryClient, shouldRetry } from "./queryClient";

function Ping({ label }: { label: string }) {
  const { data } = useQuery({
    queryKey: ["ping"],
    queryFn: async () => (await fetch(`${apiBaseUrl()}/ping`)).text(),
  });
  return <p>{data ? `${label}: ${data}` : null}</p>;
}

describe("shared/web-app: Pages share one server-state cache", () => {
  it("serves a second request for the same key from the cache", async () => {
    let requests = 0;
    server.use(
      http.get(`${apiBaseUrl()}/ping`, () => {
        requests += 1;
        return HttpResponse.text("pong");
      }),
    );
    const client = createQueryClient();

    const { rerender } = render(
      <QueryClientProvider client={client}>
        <Ping label="first" />
      </QueryClientProvider>,
    );
    expect(await screen.findByText("first: pong")).toBeInTheDocument();

    rerender(
      <QueryClientProvider client={client}>
        <Ping label="first" />
        <Ping label="second" />
      </QueryClientProvider>,
    );
    expect(await screen.findByText("second: pong")).toBeInTheDocument();
    expect(requests).toBe(1);
  });
});

describe("query retry rule", () => {
  async function httpError(status: number) {
    return ApiError.fromResponse(new Response(null, { status }));
  }

  it("does not retry client errors", async () => {
    expect(shouldRetry(0, await httpError(404))).toBe(false);
  });

  it("retries server and network errors up to twice", async () => {
    expect(shouldRetry(0, await httpError(503))).toBe(true);
    expect(shouldRetry(1, ApiError.network(new TypeError("offline")))).toBe(true);
    expect(shouldRetry(2, await httpError(503))).toBe(false);
  });
});
