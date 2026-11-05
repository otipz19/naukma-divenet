import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { MIRA, startSignedIn } from "../../test/auth";
import { renderRoute } from "../../test/render";
import { server } from "../../test/server";

const origin = window.location.origin;

function serveProfile(id: number, flags: { showDiveLog?: boolean; showStatistics?: boolean } = {}) {
  const requested: string[] = [];
  const track = (name: string, body: unknown) => () => {
    requested.push(name);
    return HttpResponse.json(body as never);
  };
  server.use(
    http.get(`${origin}/api/v1/users/${id}`, () =>
      HttpResponse.json({
        id,
        displayName: "Oleh Kravets",
        showDiveLog: true,
        showStatistics: true,
        showCertificates: true,
        ...flags,
      }),
    ),
    http.get(
      `${origin}/api/v1/users/${id}/dive-stats`,
      track("stats", { dives: 112, sites: 38, deepest: 40 }),
    ),
    http.get(
      `${origin}/api/v1/users/${id}/visited-sites`,
      track("visited", [
        { siteId: 7, name: "Blue Hole", countryCode: "EG", regionCode: "eg-dahab", dives: 6 },
      ]),
    ),
    http.get(
      `${origin}/api/v1/users/${id}/dive-log`,
      track("log", {
        content: [
          {
            id: 1,
            siteId: 7,
            siteName: "Blue Hole",
            countryCode: "EG",
            regionCode: "eg-dahab",
            date: "2026-05-12",
          },
        ],
        page: { number: 0, size: 20, totalElements: 1, totalPages: 1 },
      }),
    ),
  );
  return requested;
}

describe("user/profile: The profile page shows dive statistics", () => {
  it("shows the three numbers", async () => {
    serveProfile(21);
    renderRoute("/users/21");

    expect(await screen.findByText("112")).toBeInTheDocument();
    // user/profile "The profile header shows the dive statistics": in the header, once.
    const header = screen.getByRole("heading", { level: 1 }).closest("section")!;
    expect(header).toContainElement(screen.getByText("112"));
    expect(screen.getAllByText("112")).toHaveLength(1);
    expect(screen.getByText("38")).toBeInTheDocument();
    expect(screen.getByText("40 m")).toBeInTheDocument();
  });

  it("neither requests nor shows hidden statistics", async () => {
    const requested = serveProfile(21, { showStatistics: false });
    renderRoute("/users/21");

    await screen.findByRole("heading", { name: "Visited sites" });
    expect(screen.queryByText("112")).not.toBeInTheDocument();
    expect(requested).not.toContain("stats");
  });
});

describe("user/profile: The profile page shows the dive history and visited sites", () => {
  it("shows visited sites and dives", async () => {
    serveProfile(21);
    renderRoute("/users/21");

    const card = await screen.findByRole("link", { name: /Egypt · Dahab · Dives: 6/ });
    expect(card).toHaveAttribute("href", "/sites/7");
    expect(await screen.findByRole("heading", { name: "Dive history" })).toBeInTheDocument();
    expect(
      within(screen.getByRole("table")).getByRole("link", { name: "Blue Hole" }),
    ).toBeInTheDocument();
  });

  it("shows the notice and makes no request for a hidden history", async () => {
    const requested = serveProfile(21, { showDiveLog: false });
    renderRoute("/users/21", { language: "uk" });

    expect(
      await screen.findByText("Історію занурень приховано налаштуваннями приватності дайвера."),
    ).toBeInTheDocument();
    await waitFor(() => expect(requested).toContain("stats"));
    expect(requested).not.toContain("log");
    expect(requested).not.toContain("visited");
  });

  it("shows the owner their hidden history after a reload", async () => {
    startSignedIn();
    const requested = serveProfile(MIRA.id, { showDiveLog: false });
    renderRoute(`/users/${MIRA.id}`);

    expect(await screen.findByRole("heading", { name: "Dive history" })).toBeInTheDocument();
    expect(requested).toContain("log");
    expect(screen.queryByText(/hidden by this diver/)).not.toBeInTheDocument();
  });

  it("shows the no-dives text", async () => {
    server.use(
      http.get(`${origin}/api/v1/users/21`, () =>
        HttpResponse.json({
          id: 21,
          displayName: "Oleh Kravets",
          showDiveLog: true,
          showStatistics: true,
          showCertificates: true,
        }),
      ),
    );
    renderRoute("/users/21");

    expect(await screen.findByText("No dives logged yet.")).toBeInTheDocument();
  });
});
