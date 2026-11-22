import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getSession, signIn, signOut } from "../../api/session";
import { ADMIN, MIRA, authResponse, startSignedIn } from "../../test/auth";
import { renderRoute } from "../../test/render";
import { useIsAdmin, useSession } from "./useSession";

describe("auth: The web app keeps the session without storing the access token", () => {
  it("restores the session on load", async () => {
    startSignedIn();

    renderRoute("/");

    await waitFor(() => expect(getSession()).toMatchObject({ status: "signedIn", user: MIRA }));
  });

  it("is signed out on load without a session", async () => {
    renderRoute("/");

    await waitFor(() => expect(getSession().status).toBe("signedOut"));
  });

  it("re-renders its component when the session changes", async () => {
    startSignedIn();
    const { result } = renderHook(() => useSession());
    expect(result.current.status).toBe("loading");

    renderRoute("/");

    await waitFor(() => expect(result.current.status).toBe("signedIn"));
  });
});

describe("auth: useIsAdmin", () => {
  it("is false while loading, signed out and for a USER, and true for an ADMIN", () => {
    const { result } = renderHook(() => useIsAdmin());
    expect(result.current).toBe(false);

    act(() => signOut());
    expect(result.current).toBe(false);

    act(() => signIn(authResponse("token-1", MIRA)));
    expect(result.current).toBe(false);

    act(() => signIn(authResponse("token-2", ADMIN)));
    expect(result.current).toBe(true);
  });
});
