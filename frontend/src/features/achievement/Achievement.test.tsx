import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { MIRA, startSignedIn } from "../../test/auth";
import { renderRoute } from "../../test/render";
import { server } from "../../test/server";
import type { Achievement } from "./api";

const origin = window.location.origin;

const EARNED: Achievement = {
  code: "first-dive",
  target: 1,
  progress: 1,
  earnedAt: "2026-05-12T10:00:00Z",
};
const LOCKED: Achievement = { code: "ten-dives", target: 10, progress: 3 };

function serveProfile(achievements: () => Response) {
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
    http.get(`${origin}/api/v1/users/21/achievements`, achievements),
  );
}

describe("user/profile: The profile page shows achievements", () => {
  it("shows an earned one, and the count", async () => {
    serveProfile(() => HttpResponse.json([EARNED, LOCKED]));
    renderRoute("/users/21");

    expect(await screen.findByText("First dive")).toBeInTheDocument();
    expect(screen.getByText("Log your first dive")).toBeInTheDocument();
    expect(screen.getByText("Earned 12 May 2026")).toBeInTheDocument();
    expect(screen.getByText("1 of 2 earned")).toBeInTheDocument();
  });

  it("shows a locked one with progress", async () => {
    serveProfile(() => HttpResponse.json([LOCKED]));
    renderRoute("/users/21");

    const bar = await screen.findByRole("progressbar", { name: "Progress towards Ten dives" });
    expect(bar).toHaveAttribute("aria-valuenow", "3");
    expect(bar).toHaveAttribute("aria-valuemax", "10");
    expect(screen.getByText("3 / 10")).toBeInTheDocument();
  });

  it("shows no bar without progress", async () => {
    serveProfile(() => HttpResponse.json([{ code: "ten-dives", target: 10 }]));
    renderRoute("/users/21");

    await screen.findByText("Ten dives");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("speaks Ukrainian", async () => {
    serveProfile(() => HttpResponse.json([EARNED]));
    renderRoute("/users/21", { language: "uk" });

    expect(await screen.findByText("Перше занурення")).toBeInTheDocument();
    expect(screen.getByText("Запишіть своє перше занурення")).toBeInTheDocument();
  });

  it("shows an alert when loading fails, and keeps the profile", async () => {
    serveProfile(() =>
      HttpResponse.json(
        { status: 400 },
        { status: 400, headers: { "Content-Type": "application/problem+json" } },
      ),
    );
    renderRoute("/users/21");

    expect(await screen.findByRole("alert")).toHaveTextContent("could not be loaded");
    expect(screen.getByRole("heading", { level: 1, name: "Oleh Kravets" })).toBeInTheDocument();
  });
});

const achievementsUrl = `${origin}/api/v1/users/${MIRA.id}/achievements`;
const logUrl = `${origin}/api/v1/dive-log`;
const NEW_DIVE = {
  id: 1,
  siteId: 7,
  siteName: "Blue Hole",
  countryCode: "EG",
  regionCode: "eg-dahab",
  date: "2026-05-12",
};

/** Each save moves on to the next list of achievements. */
function serveSaves(...lists: Achievement[][]) {
  let index = 0;
  server.use(
    http.get(achievementsUrl, () => HttpResponse.json(lists[index] ?? [])),
    http.post(logUrl, () => {
      index += 1;
      return HttpResponse.json(NEW_DIVE, { status: 201 });
    }),
    http.get(`${origin}/api/v1/sites/markers`, () =>
      HttpResponse.json([{ id: 7, name: "Blue Hole", lat: 28, lng: 34, regionCode: "eg-dahab" }]),
    ),
  );
}

async function saveADive(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText("Site"), "Blue");
  await user.click(await screen.findByRole("button", { name: /Blue Hole/ }));
  await user.click(screen.getByRole("button", { name: "Save dive" }));
}

const firstDive = { ...LOCKED, code: "first-dive", target: 1, progress: 0 };
const deep = { code: "deep-diver", target: 40, progress: 10 };

describe("divelog/log-page: The dive log page announces an unlocked achievement", () => {
  it("announces one", async () => {
    startSignedIn();
    serveSaves([firstDive], [EARNED]);
    renderRoute("/dive-log");
    await waitFor(() => expect(screen.getByLabelText("Site")).toBeInTheDocument());

    await saveADive(userEvent.setup());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Achievement unlocked: First dive");
    expect(alert).toHaveTextContent("Log your first dive");
  });

  it("names both when a save earns two", async () => {
    startSignedIn();
    serveSaves(
      [firstDive, deep],
      [EARNED, { code: "deep-diver", target: 40, progress: 40, earnedAt: "2026-05-12T10:00:00Z" }],
    );
    renderRoute("/dive-log");

    await saveADive(userEvent.setup());

    expect(await screen.findByText("Achievement unlocked: First dive")).toBeInTheDocument();
    expect(screen.getByText("Achievement unlocked: Deep diver")).toBeInTheDocument();
  });

  it("shows nothing when a save earns nothing", async () => {
    startSignedIn();
    serveSaves([EARNED], [EARNED]);
    renderRoute("/dive-log");

    await saveADive(userEvent.setup());

    await waitFor(() => expect(screen.getByRole("button", { name: "Save dive" })).toBeEnabled());
    expect(screen.queryByText(/Achievement unlocked/)).not.toBeInTheDocument();
  });

  it("goes away on the next save", async () => {
    startSignedIn();
    serveSaves([firstDive], [EARNED], [EARNED]);
    renderRoute("/dive-log");
    const user = userEvent.setup();

    await saveADive(user);
    await screen.findByText("Achievement unlocked: First dive");
    await saveADive(user);

    await waitFor(() => expect(screen.queryByText(/Achievement unlocked/)).not.toBeInTheDocument());
  });
});
