import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MIRA, startSignedIn } from "../../test/auth";
import { renderRoute } from "../../test/render";

describe("RequireAuth", () => {
  it("sends a signed-out visitor to the login page", async () => {
    renderRoute("/sites/new");

    expect(await screen.findByRole("heading", { name: "Log in" })).toBeInTheDocument();
  });

  it("shows a signed-in user the page", async () => {
    startSignedIn();
    renderRoute("/sites/new");

    expect(await screen.findByRole("heading", { name: "Submit a dive site" })).toBeInTheDocument();
  });

  it("shows a non-admin the not-found page on an admin page", async () => {
    startSignedIn();
    renderRoute("/admin/moderation");

    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  });

  it("shows an admin the admin page", async () => {
    startSignedIn({ ...MIRA, role: "ADMIN" });
    renderRoute("/admin/moderation");

    expect(await screen.findByRole("heading", { name: "Moderation" })).toBeInTheDocument();
  });
});
