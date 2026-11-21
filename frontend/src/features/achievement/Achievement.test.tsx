import { screen, waitFor, within } from "@testing-library/react";
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
  requests = { achievements: 0 };
  server.use(
    http.get(achievementsUrl, () => {
      requests.achievements += 1;
      return HttpResponse.json(lists[index] ?? []);
    }),
    http.post(logUrl, () => {
      index += 1;
      return HttpResponse.json(NEW_DIVE, { status: 201 });
    }),
    http.get(`${origin}/api/v1/sites/markers`, () =>
      HttpResponse.json([{ id: 7, name: "Blue Hole", lat: 28, lng: 34, regionCode: "eg-dahab" }]),
    ),
  );
}

/** Opens the Log a dive dialog from the header, chooses the site and saves. */
async function saveADive(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "Log a dive" }));
  const dialog = screen.getByRole("dialog", { name: "Log a dive" });
  await user.type(within(dialog).getByLabelText("Site"), "Blue");
  await user.click(await within(dialog).findByRole("button", { name: /Blue Hole/ }));
  await user.click(within(dialog).getByRole("button", { name: "Save dive" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
}

const firstDive = { ...LOCKED, code: "first-dive", target: 1, progress: 0 };
const deep = { code: "deep-diver", target: 40, progress: 10 };
const toasts = () => screen.getByRole("status");

/** Waits until the page has the before-save list, which the announcement compares against. */
async function renderLog() {
  renderRoute("/dive-log");
  await waitFor(() => expect(requests.achievements).toBeGreaterThan(0));
}

let requests = { achievements: 0 };

describe("divelog/log-page: The dive log page announces an unlocked achievement", () => {
  it("shows a toast for one, after the dialog closes", async () => {
    startSignedIn();
    serveSaves([firstDive], [EARNED]);
    await renderLog();

    await saveADive(userEvent.setup());

    await waitFor(() => expect(toasts()).toHaveTextContent("Achievement unlocked: First dive"));
    expect(toasts()).toHaveTextContent("Log your first dive");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows two toasts when a save earns two", async () => {
    startSignedIn();
    serveSaves(
      [firstDive, deep],
      [EARNED, { code: "deep-diver", target: 40, progress: 40, earnedAt: "2026-05-12T10:00:00Z" }],
    );
    await renderLog();

    await saveADive(userEvent.setup());

    expect(
      await within(toasts()).findByText("Achievement unlocked: First dive"),
    ).toBeInTheDocument();
    expect(within(toasts()).getByText("Achievement unlocked: Deep diver")).toBeInTheDocument();
  });

  it("shows no toast when a save earns nothing", async () => {
    startSignedIn();
    serveSaves([EARNED], [EARNED]);
    await renderLog();

    await saveADive(userEvent.setup());

    await waitFor(() => expect(requests.achievements).toBeGreaterThan(1));
    expect(toasts()).toBeEmptyDOMElement();
  });

  it("adds no toast on a next save that earns nothing", async () => {
    startSignedIn();
    serveSaves([firstDive], [EARNED], [EARNED]);
    await renderLog();
    const user = userEvent.setup();

    await saveADive(user);
    await within(toasts()).findByText("Achievement unlocked: First dive");
    await saveADive(user);

    await waitFor(() => expect(requests.achievements).toBeGreaterThan(2));
    expect(within(toasts()).getAllByText(/Achievement unlocked/)).toHaveLength(1);
  });

  it("links to the user's achievements", async () => {
    startSignedIn();
    serveSaves([firstDive], [EARNED]);
    await renderLog();

    await saveADive(userEvent.setup());

    expect(await within(toasts()).findByRole("link", { name: "See achievements" })).toHaveAttribute(
      "href",
      `/users/${MIRA.id}`,
    );
  });
});
