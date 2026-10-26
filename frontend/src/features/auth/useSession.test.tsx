import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getSession } from "../../api/session";
import { MIRA, startSignedIn } from "../../test/auth";
import { renderRoute } from "../../test/render";
import { useSession } from "./useSession";

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
