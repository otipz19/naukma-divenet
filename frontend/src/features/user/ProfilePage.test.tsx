import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { MIRA, startSignedIn } from "../../test/auth";
import { renderRoute } from "../../test/render";
import { server } from "../../test/server";
import type { Profile } from "./api";

const url = (id: number) => `${window.location.origin}/api/v1/users/${id}`;

const profile = (overrides: Partial<Profile> = {}): Profile => ({
  id: 21,
  displayName: "Oleh Kravets",
  bio: "Weekend wreck diver",
  avatar: {
    id: "a1",
    url: "/media/a1",
    thumbnailUrl: "/media/a1/thumb",
    width: 40,
    height: 30,
  },
  showDiveLog: true,
  showStatistics: true,
  showCertificates: true,
  ...overrides,
});

const serve = (body: Profile) => server.use(http.get(url(body.id), () => HttpResponse.json(body)));
const problem = (status: number) =>
  HttpResponse.json(
    { status },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );

describe("user/profile: The profile page shows the diver", () => {
  it("shows the name, avatar and bio", async () => {
    serve(profile());
    const { container } = renderRoute("/users/21");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Oleh Kravets" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Weekend wreck diver")).toBeInTheDocument();
    expect(container.querySelector("main img")).toHaveAttribute("src", "/media/a1");
  });

  it("shows initials and no empty bio without either", async () => {
    serve(profile({ bio: undefined, avatar: undefined }));
    const { container } = renderRoute("/users/21");

    expect(await screen.findByText("OK")).toBeInTheDocument();
    expect(container.querySelector("main img")).toBeNull();
    expect(container.querySelector("main p")).toBeNull();
  });

  it("shows not-found on a 404", async () => {
    server.use(http.get(url(21), () => problem(404)));
    renderRoute("/users/21");

    expect(await screen.findByRole("heading", { name: "Diver not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the map" })).toHaveAttribute("href", "/");
  });

  it("shows an alert on a server error", async () => {
    server.use(http.get(url(21), () => problem(500)));
    renderRoute("/users/21");

    expect(await screen.findByRole("alert", {}, { timeout: 8000 })).toHaveTextContent(
      "This profile could not be loaded.",
    );
  }, 10000);
});

describe("user/profile: Owners reach their edit page", () => {
  it("shows the owner an edit link", async () => {
    startSignedIn();
    serve(profile({ id: MIRA.id, displayName: MIRA.displayName }));
    renderRoute(`/users/${MIRA.id}`);

    expect(await screen.findByRole("link", { name: "Edit profile" })).toHaveAttribute(
      "href",
      "/profile/edit",
    );
  });

  it("shows other visitors no edit link", async () => {
    startSignedIn();
    serve(profile());
    renderRoute("/users/21");

    await screen.findByRole("heading", { level: 1, name: "Oleh Kravets" });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Mira Koval/ })).toBeInTheDocument(),
    );
    expect(screen.queryByRole("link", { name: "Edit profile" })).not.toBeInTheDocument();
  });

  it("links the account menu to the user's profile", async () => {
    startSignedIn();
    renderRoute("/");

    await userEvent.click(await screen.findByRole("button", { name: /Mira Koval/ }));

    expect(screen.getByRole("menuitem", { name: "Your profile" })).toHaveAttribute(
      "href",
      `/users/${MIRA.id}`,
    );
  });
});
