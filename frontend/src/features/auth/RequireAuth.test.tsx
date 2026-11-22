import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ADMIN, MIRA, startSignedIn } from "../../test/auth";
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

describe("auth: Diver pages send the admin to moderation", () => {
  it("replaces a diver page with the moderation page for an admin", async () => {
    startSignedIn(ADMIN);
    renderRoute("/sites/new");

    expect(await screen.findByRole("heading", { name: "Moderation" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Submit a dive site" })).not.toBeInTheDocument();
  });

  it("shows a USER the diver page", async () => {
    startSignedIn();
    renderRoute("/sites/new");

    expect(await screen.findByRole("heading", { name: "Submit a dive site" })).toBeInTheDocument();
  });

  it("still sends a signed-out visitor to the login page", async () => {
    renderRoute("/sites/new");

    expect(await screen.findByRole("heading", { name: "Log in" })).toBeInTheDocument();
  });
});
