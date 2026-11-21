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

const dialog = (name = "Log a dive") => screen.getByRole("dialog", { name });

async function openNew(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "Log a dive" }));
  return dialog();
}

describe("divelog/log-page: The form logs a dive", () => {
  it("shows no form on the page", async () => {
    startSignedIn();
    serveLog(entry());
    renderRoute("/dive-log");

    await screen.findByRole("link", { name: "Blue Hole" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Site")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save dive" })).not.toBeInTheDocument();
  });

  it("offers matching sites in the dialog, sends the values and closes", async () => {
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

    const form = await openNew(user);
    await chooseSite(user);
    expect(within(form).getByText("Blue Hole")).toBeInTheDocument();
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
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("shows field errors in the dialog and sends nothing", async () => {
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

    const form = await openNew(user);
    await user.type(within(form).getByLabelText("Max depth (m)"), "401");
    await user.click(save());

    expect(await within(form).findByText("Choose a site.")).toBeInTheDocument();
    expect(
      within(form).getByText("Use a number from 0 to 400, with one decimal at most."),
    ).toBeInTheDocument();
    expect(sent).toBe(false);
  });

  it("keeps the dialog open with an alert and the values when saving fails", async () => {
    startSignedIn();
    serveMarkers();
    server.use(http.post(writeUrl, () => HttpResponse.json({ status: 500 }, { status: 500 })));
    renderRoute("/dive-log");
    const user = userEvent.setup();

    const form = await openNew(user);
    await chooseSite(user);
    await user.type(screen.getByLabelText("Max depth (m)"), "12");
    await user.click(save());

    expect(await within(form).findByRole("alert")).toHaveTextContent("could not be saved");
    expect(dialog()).toBeInTheDocument();
    expect(screen.getByLabelText("Max depth (m)")).toHaveValue("12");
  });
});

describe("divelog/log-page: The page can start from a site", () => {
  const serveSite = () =>
    server.use(
      http.get(`${origin}/api/v1/sites/7`, () =>
        HttpResponse.json({ id: 7, name: "Blue Hole", status: "APPROVED" }),
      ),
    );

  it("opens the dialog with the site from the URL chosen", async () => {
    startSignedIn();
    serveSite();
    renderRoute("/dive-log?site=7");

    const form = await screen.findByRole("dialog", { name: "Log a dive" });
    expect(within(form).getByText("Blue Hole")).toBeInTheDocument();
    expect(within(form).getByRole("button", { name: "Change" })).toBeInTheDocument();
  });

  it("does not open it again after a save", async () => {
    startSignedIn();
    serveSite();
    server.use(http.post(writeUrl, () => HttpResponse.json(entry(), { status: 201 })));
    renderRoute("/dive-log?site=7");
    const user = userEvent.setup();

    await screen.findByRole("dialog", { name: "Log a dive" });
    await user.click(save());
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const form = await openNew(user);

    expect(within(form).getByLabelText("Site")).toHaveValue("");
    expect(within(form).queryByRole("button", { name: "Change" })).not.toBeInTheDocument();
  });
});

describe("divelog/log-page: Entries are edited and deleted from the page", () => {
  const editName = "Edit dive at Blue Hole, 12 May 2026";
  const deleteName = "Delete dive at Blue Hole, 12 May 2026";

  it("edits in a dialog named after the entry", async () => {
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

    await user.click(await screen.findByRole("button", { name: editName }));
    const form = dialog("Edit dive: Blue Hole, 12 May 2026");
    const depth = within(form).getByLabelText("Max depth (m)");
    expect(depth).toHaveValue("30.4");
    await user.clear(depth);
    await user.type(depth, "12.5");
    await user.click(save());

    await waitFor(() => expect(sent?.maxDepth).toBe(12.5));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("deletes from the row after a confirmation that names the entry", async () => {
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

    await user.click(await screen.findByRole("button", { name: deleteName }));
    const question = dialog("Delete the dive at Blue Hole on 12 May 2026?");
    expect(within(question).getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.click(within(question).getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("You have not logged a dive yet.")).toBeInTheDocument();
    expect(deleted).toBe(true);
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

    await user.click(await screen.findByRole("button", { name: deleteName }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Blue Hole" })).toBeInTheDocument();
    expect(deleted).toBe(false);
  });

  it("shows an alert and keeps the row when deleting fails", async () => {
    startSignedIn();
    serveLog(entry());
    server.use(
      http.delete(`${writeUrl}/1`, () => HttpResponse.json({ status: 500 }, { status: 500 })),
    );
    renderRoute("/dive-log");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: deleteName }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("could not be deleted");
    expect(screen.getByRole("link", { name: "Blue Hole" })).toBeInTheDocument();
  });
});

describe("divelog/log-page: The header offers to log a new dive", () => {
  it("opens an empty Log a dive dialog after an edit, with focus on the site", async () => {
    startSignedIn();
    serveLog(entry());
    renderRoute("/dive-log");
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: "Edit dive at Blue Hole, 12 May 2026" }),
    );
    const edit = dialog("Edit dive: Blue Hole, 12 May 2026");
    await user.click(within(edit).getByRole("button", { name: "Cancel" }));
    const form = await openNew(user);

    const site = within(form).getByLabelText("Site");
    expect(site).toHaveValue("");
    expect(site).toHaveFocus();
    expect(within(form).getByLabelText("Max depth (m)")).toHaveValue("");
    expect(within(form).getByLabelText("Date")).not.toHaveValue("");
  });
});
