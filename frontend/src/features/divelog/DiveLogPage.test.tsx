import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { MIRA, authResponse, startSignedIn } from "../../test/auth";
import { renderRoute } from "../../test/render";
import { server } from "../../test/server";
import { formatDiveDate, formatDiveNumber, type DiveEntry } from "./api";

const origin = window.location.origin;
const logUrl = `${origin}/api/v1/users/${MIRA.id}/dive-log`;
const writeUrl = `${origin}/api/v1/dive-log`;

const entry = (overrides: Partial<DiveEntry> = {}): DiveEntry => ({
  id: 1,
  siteId: 7,
  siteName: "Blue Hole",
  countryCode: "EG",
  regionCode: "eg-dahab",
  date: "2026-05-12",
  maxDepth: 30.4,
  waterTemperature: 24,
  ...overrides,
});

const page = (content: DiveEntry[], number = 0, totalPages = 1) => ({
  content,
  page: { number, size: 20, totalElements: content.length, totalPages },
});

const serveLog = (...entries: DiveEntry[]) =>
  server.use(http.get(logUrl, () => HttpResponse.json(page(entries))));

const serveMarkers = () =>
  server.use(
    http.get(`${origin}/api/v1/sites/markers`, () =>
      HttpResponse.json([
        {
          id: 7,
          name: "Blue Hole",
          lat: 28,
          lng: 34,
          countryCode: "EG",
          regionCode: "eg-dahab",
          difficulty: 1,
          minDepth: 5,
          maxDepth: 20,
        },
      ]),
    ),
  );

const save = () => screen.getByRole("button", { name: "Save dive" });

async function chooseSite(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText("Site"), "blue");
  await user.click(await screen.findByRole("button", { name: /Blue Hole/ }));
}

describe("divelog/log-page: The dive log page needs a signed-in user", () => {
  it("returns to the page after logging in", async () => {
    server.use(http.post(`${origin}/api/v1/auth/login`, () => HttpResponse.json(authResponse())));
    renderRoute("/dive-log");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Email"), "a@b.c");
    await user.type(screen.getByLabelText("Password"), "correct-horse");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Dive log" })).toBeInTheDocument();
  });

  it("is in the main navigation", () => {
    renderRoute("/");

    const nav = within(screen.getByRole("banner")).getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "Dive log" })).toHaveAttribute(
      "href",
      "/dive-log",
    );
  });
});

describe("divelog/log-page: The page lists the user's dives", () => {
  it("shows the table and statistics, with a dash for a missing value", async () => {
    startSignedIn();
    serveLog(entry());
    server.use(
      http.get(`${origin}/api/v1/users/${MIRA.id}/dive-stats`, () =>
        HttpResponse.json({ dives: 47, sites: 21, deepest: 38.2 }),
      ),
    );
    renderRoute("/dive-log");

    const row = (await screen.findByRole("link", { name: "Blue Hole" })).closest("tr")!;
    expect(screen.getByRole("link", { name: "Blue Hole" })).toHaveAttribute("href", "/sites/7");
    expect(within(row).getByText("Egypt · Dahab")).toBeInTheDocument();
    expect(within(row).getByText("30.4 m")).toBeInTheDocument();
    expect(within(row).getByText("24 °C")).toBeInTheDocument();
    expect(within(row).getByText("—")).toBeInTheDocument();
    expect(await screen.findByText("Dives: 47 · Sites: 21 · Deepest: 38.2 m")).toBeInTheDocument();
  });

  it("formats a date as the logged day whatever the time zone", () => {
    vi.stubEnv("TZ", "America/Los_Angeles");
    // Local time here is the day before, which is what a naive format would show.
    expect(new Date("2026-05-12").getDate()).toBe(11);

    expect(formatDiveDate("2026-05-12", "en")).toBe("12 May 2026");
    vi.unstubAllEnvs();
  });

  it("formats numbers for the active language", () => {
    expect(formatDiveNumber(30.4, "en")).toBe("30.4");
    expect(formatDiveNumber(30.4, "uk")).toBe("30,4");
  });

  it("shows the empty-log text", async () => {
    startSignedIn();
    renderRoute("/dive-log", { language: "uk" });

    expect(await screen.findByText("Ви ще не записали жодного занурення.")).toBeInTheDocument();
  });

  it("loads more", async () => {
    startSignedIn();
    server.use(
      http.get(logUrl, ({ request }) =>
        new URL(request.url).searchParams.get("page") === "1"
          ? HttpResponse.json(page([entry({ id: 2, siteName: "Canyon" })], 1, 2))
          : HttpResponse.json(page([entry()], 0, 2)),
      ),
    );
    renderRoute("/dive-log");

    await userEvent.click(await screen.findByRole("button", { name: "Load more" }));

    expect(await screen.findByRole("link", { name: "Canyon" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Blue Hole" })).toBeInTheDocument();
  });

  it("shows an alert when the log cannot be loaded", async () => {
    startSignedIn();
    server.use(http.get(logUrl, () => HttpResponse.json({ status: 500 }, { status: 500 })));
    renderRoute("/dive-log");

    expect(await screen.findByRole("alert", {}, { timeout: 8000 })).toHaveTextContent(
      "could not be loaded",
    );
  }, 10000);
});

describe("divelog/log-page: The form logs a dive", () => {
  it("offers matching sites, sends the values and starts over", async () => {
    startSignedIn();
    serveMarkers();
    let sent: unknown;
    server.use(
      http.post(writeUrl, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(entry(), { status: 201 });
      }),
    );
    renderRoute("/dive-log");
    const user = userEvent.setup();

    await chooseSite(user);
    await user.clear(screen.getByLabelText("Date"));
    await user.type(screen.getByLabelText("Date"), "2026-05-12");
    await user.type(screen.getByLabelText("Max depth (m)"), "30.4");
    await user.selectOptions(screen.getByLabelText("Current"), "MILD");
    await user.type(screen.getByLabelText("Buddies"), "Oleh");
    await user.click(save());

    await waitFor(() =>
      expect(sent).toEqual({
        siteId: 7,
        date: "2026-05-12",
        maxDepth: 30.4,
        current: "MILD",
        buddies: "Oleh",
      }),
    );
    expect(await screen.findByLabelText("Site")).toHaveValue("");
    expect(screen.getByLabelText("Max depth (m)")).toHaveValue("");
  });

  it("shows field errors and sends nothing", async () => {
    startSignedIn();
    let sent = false;
    server.use(
      http.post(writeUrl, () => {
        sent = true;
        return HttpResponse.json(entry(), { status: 201 });
      }),
    );
    renderRoute("/dive-log");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Max depth (m)"), "401");
    await user.click(save());

    expect(await screen.findByText("Choose a site.")).toBeInTheDocument();
    expect(
      screen.getByText("Use a number from 0 to 400, with one decimal at most."),
    ).toBeInTheDocument();
    expect(sent).toBe(false);
  });

  it("shows an alert and keeps the values when saving fails", async () => {
    startSignedIn();
    serveMarkers();
    server.use(http.post(writeUrl, () => HttpResponse.json({ status: 500 }, { status: 500 })));
    renderRoute("/dive-log");
    const user = userEvent.setup();

    await chooseSite(user);
    await user.type(screen.getByLabelText("Max depth (m)"), "12");
    await user.click(save());

    expect(await screen.findByRole("alert")).toHaveTextContent("could not be saved");
    expect(screen.getByLabelText("Max depth (m)")).toHaveValue("12");
  });
});

describe("divelog/log-page: The page can start from a site", () => {
  it("opens with the site from the URL chosen", async () => {
    startSignedIn();
    server.use(
      http.get(`${origin}/api/v1/sites/7`, () =>
        HttpResponse.json({ id: 7, name: "Blue Hole", status: "APPROVED" }),
      ),
    );
    renderRoute("/dive-log?site=7");

    expect(await screen.findByText("Blue Hole")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change" })).toBeInTheDocument();
  });
});

describe("divelog/log-page: Entries are edited and deleted from the page", () => {
  it("fills the form and updates the entry", async () => {
    startSignedIn();
    serveLog(entry());
    let sent: { maxDepth?: number } | undefined;
    server.use(
      http.put(`${writeUrl}/1`, async ({ request }) => {
        sent = (await request.json()) as { maxDepth?: number };
        return HttpResponse.json(entry());
      }),
    );
    renderRoute("/dive-log");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Edit dive at Blue Hole" }));
    const depth = screen.getByLabelText("Max depth (m)");
    expect(depth).toHaveValue("30.4");
    await user.clear(depth);
    await user.type(depth, "12.5");
    await user.click(save());

    await waitFor(() => expect(sent?.maxDepth).toBe(12.5));
    expect(await screen.findByRole("heading", { name: "Log a dive" })).toBeInTheDocument();
  });

  it("deletes after confirmation", async () => {
    startSignedIn();
    let deleted = false;
    server.use(
      http.get(logUrl, () => HttpResponse.json(page(deleted ? [] : [entry()]))),
      http.delete(`${writeUrl}/1`, () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderRoute("/dive-log");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Edit dive at Blue Hole" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Yes, delete" }));

    expect(await screen.findByText("You have not logged a dive yet.")).toBeInTheDocument();
  });

  it("sends nothing when the confirmation is cancelled", async () => {
    startSignedIn();
    serveLog(entry());
    let deleted = false;
    server.use(
      http.delete(`${writeUrl}/1`, () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderRoute("/dive-log");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Edit dive at Blue Hole" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Keep it" }));

    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(deleted).toBe(false);
  });
});

describe("divelog/log-page: The header offers to log a new dive", () => {
  it("leaves an edit for an empty form, and focuses it", async () => {
    startSignedIn();
    serveLog(entry());
    renderRoute("/dive-log");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Edit dive at Blue Hole" }));
    expect(await screen.findByRole("heading", { name: "Edit dive" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Log a dive" }));

    expect(await screen.findByRole("heading", { name: "Log a dive" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Site")).toHaveFocus());
    expect(screen.getByLabelText("Site")).toHaveValue("");
  });
});
