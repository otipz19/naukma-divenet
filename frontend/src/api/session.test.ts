import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { MIRA, authResponse } from "../test/auth";
import { refreshUrl, server } from "../test/server";
import { getSession, refreshSession, restoreSession, signIn } from "./session";

describe("auth: The web app keeps the session without storing the access token", () => {
  it("restores the session on load when the refresh succeeds", async () => {
    server.use(http.post(refreshUrl(), () => HttpResponse.json(authResponse())));

    expect(getSession().status).toBe("loading");
    await restoreSession();

    expect(getSession()).toEqual({ status: "signedIn", user: MIRA, accessToken: "token-1" });
  });

  it("is signed out on load when the refresh answers 401", async () => {
    await restoreSession();

    expect(getSession().status).toBe("signedOut");
  });

  it("sends one refresh request for concurrent callers", async () => {
    let calls = 0;
    server.use(
      http.post(refreshUrl(), () => {
        calls += 1;
        return HttpResponse.json(authResponse());
      }),
    );

    const results = await Promise.all([refreshSession(), refreshSession(), restoreSession()]);

    expect(calls).toBe(1);
    expect(results.slice(0, 2)).toEqual([true, true]);
  });

  it("signs out when the refresh fails", async () => {
    signIn(authResponse());

    expect(await refreshSession()).toBe(false);
    expect(getSession().status).toBe("signedOut");
  });

  it("never stores the access token in browser storage", () => {
    signIn(authResponse("secret-access-token"));

    const stored = [localStorage, sessionStorage].flatMap((storage) =>
      Object.keys(storage).map((key) => storage.getItem(key) ?? ""),
    );
    expect(stored.join()).not.toContain("secret-access-token");
    expect(document.cookie).not.toContain("secret-access-token");
  });
});
