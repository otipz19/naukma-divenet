import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import type { components } from "../../api/schema.gen";
import alertStyles from "../../components/Alert/Alert.module.css";
import { MIRA, startSignedIn } from "../../test/auth";
import { renderRoute } from "../../test/render";
import { server } from "../../test/server";
import type { Warning } from "./api";

const origin = window.location.origin;
const siteUrl = `${origin}/api/v1/sites/7`;
const warningsUrl = `${origin}/api/v1/sites/7/warnings`;

const site = (): components["schemas"]["SiteResponse"] => ({
  id: 7,
  name: "Blue Hole",
  lat: 28.5722,
  lng: 34.5375,
  countryCode: "EG",
  regionCode: "eg-dahab",
  difficulty: 4,
  minDepth: 6,
  maxDepth: 40,
  description: "A famous sinkhole.",
  requiredGear: [],
  recommendedGear: [],
  ratingCount: 0,
  reviewCount: 0,
  status: "APPROVED",
});

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const warning = (overrides: Partial<Warning> = {}): Warning => ({
  id: 1,
  siteId: 7,
  author: { id: 7, displayName: "Mira Koval" },
  type: "HAZARD",
  text: "Strong current on the bow line",
  createdAt: daysAgoIso(2),
  updatedAt: daysAgoIso(2),
  ...overrides,
});

const page = (content: Warning[], number = 0, totalPages = 1, totalElements = content.length) => ({
  content,
  page: { size: 10, number, totalElements, totalPages },
});

function serve(answer: (url: URL) => ReturnType<typeof page>) {
  const urls: URL[] = [];
  server.use(
    http.get(siteUrl, () => HttpResponse.json(site())),
    http.get(warningsUrl, ({ request }) => {
      const url = new URL(request.url);
      urls.push(url);
      return HttpResponse.json(answer(url));
    }),
    http.get(`${origin}/api/v1/sites/7/reviews/mine`, () =>
      HttpResponse.json(
        { status: 404 },
        { status: 404, headers: { "Content-Type": "application/problem+json" } },
      ),
    ),
  );
  return { urls };
}

const alertBox = async (text: string) =>
  (await screen.findByText(text)).closest(`.${alertStyles.alert}`) as HTMLElement;

describe("warning/site-warnings: The site page shows recent warnings", () => {
  it("shows a warning alert with type, relative time, author and text", async () => {
    serve(() => page([warning()]));
    renderRoute("/sites/7");

    expect(await screen.findByText("Hazard · 2 days ago · Mira Koval")).toBeInTheDocument();
    expect(screen.getByText("Strong current on the bow line")).toBeInTheDocument();
  });

  it("shows type and relative time in Ukrainian", async () => {
    serve(() => page([warning()]));
    renderRoute("/sites/7", { language: "uk" });

    const rtfUk = new Intl.RelativeTimeFormat("uk", { numeric: "auto" }).format(-2, "day");
    expect(await screen.findByText(`Небезпека · ${rtfUk} · Mira Koval`)).toBeInTheDocument();
  });
});

describe("warning/site-warnings: A warning's tone follows its type", () => {
  it("uses danger tone for HAZARD and INCIDENT, caution tone for CHANGED_CONDITIONS and MARINE_LIFE", async () => {
    serve(() =>
      page([
        warning({ id: 1, type: "INCIDENT", text: "Anchor dragged" }),
        warning({ id: 2, type: "MARINE_LIFE", text: "Triggerfish nesting" }),
      ]),
    );
    renderRoute("/sites/7");

    const incidentText = await screen.findByText("Anchor dragged");
    const marineText = screen.getByText("Triggerfish nesting");
    expect(incidentText.closest(`.${alertStyles.alert}`)).toHaveClass(alertStyles.danger!);
    expect(marineText.closest(`.${alertStyles.alert}`)).toHaveClass(alertStyles.caution!);
  });
});

describe("warning/site-warnings: Only the two newest warnings show at first", () => {
  it("shows the two newest warnings with Show all warnings (5) and expands when pressed", async () => {
    const five = [1, 2, 3, 4, 5].map((n) => warning({ id: n, text: `Warning ${n}` }));
    serve(() => page(five, 0, 1, 5));
    renderRoute("/sites/7");

    expect(await screen.findByText("Warning 1")).toBeInTheDocument();
    expect(screen.getByText("Warning 2")).toBeInTheDocument();
    expect(screen.queryByText("Warning 3")).not.toBeInTheDocument();
    const showAll = screen.getByRole("button", { name: "Show all warnings (5)" });

    await userEvent.click(showAll);

    expect(screen.getByText("Warning 3")).toBeInTheDocument();
    expect(screen.getByText("Warning 5")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Show all warnings/ })).not.toBeInTheDocument();
  });

  it("loads more pages after expanding", async () => {
    const firstPage = [1, 2, 3].map((n) => warning({ id: n, text: `Page 1 Warning ${n}` }));
    const { urls } = serve((url) =>
      url.searchParams.get("page") === "1"
        ? page([warning({ id: 4, text: "Page 2 Warning 4" })], 1, 2, 4)
        : page(firstPage, 0, 2, 4),
    );
    renderRoute("/sites/7");

    await userEvent.click(await screen.findByRole("button", { name: "Show all warnings (4)" }));
    await userEvent.click(screen.getByRole("button", { name: "Load more warnings" }));

    expect(await screen.findByText("Page 2 Warning 4")).toBeInTheDocument();
    expect(urls[urls.length - 1]!.searchParams.get("page")).toBe("1");
    expect(screen.queryByRole("button", { name: "Load more warnings" })).not.toBeInTheDocument();
  });

  it("shows both warnings with no Show all warnings button when there are 2", async () => {
    serve(() =>
      page([warning({ id: 1, text: "First warning" }), warning({ id: 2, text: "Second warning" })]),
    );
    renderRoute("/sites/7");

    expect(await screen.findByText("First warning")).toBeInTheDocument();
    expect(screen.getByText("Second warning")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Show all warnings/ })).not.toBeInTheDocument();
  });

  it("shows the no-warnings text when there are none", async () => {
    serve(() => page([]));
    renderRoute("/sites/7", { language: "uk" });

    expect(await screen.findByText("Для цього місця попереджень ще немає.")).toBeInTheDocument();
  });

  it("shows an error alert when the warnings request fails while the rest of the page renders", async () => {
    server.use(
      http.get(siteUrl, () => HttpResponse.json(site())),
      http.get(warningsUrl, () =>
        HttpResponse.json(
          { status: 500 },
          { status: 500, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    );
    renderRoute("/sites/7");

    expect(await screen.findByRole("alert", {}, { timeout: 8000 })).toHaveTextContent(
      "The warnings could not be loaded.",
    );
    expect(screen.getByText("A famous sinkhole.")).toBeInTheDocument();
  }, 10000);
});

describe("warning/site-warnings: The section offers to report a warning", () => {
  it("links Report a warning to /sites/7/warnings/new", async () => {
    serve(() => page([]));
    renderRoute("/sites/7");

    expect(await screen.findByRole("link", { name: "Report a warning" })).toHaveAttribute(
      "href",
      "/sites/7/warnings/new",
    );
  });
});

describe("warning/site-warnings: Authors manage their warnings on the site page", () => {
  const own = warning({
    id: 12,
    author: { id: 7, displayName: "Mira Koval" },
    text: "My own warning",
  });
  const other = warning({
    id: 13,
    author: { id: 21, displayName: "Oleh Kravets" },
    text: "Someone else's warning",
  });

  it("shows Edit and Delete only on the user's own warning", async () => {
    startSignedIn();
    serve(() => page([own, other]));
    renderRoute("/sites/7");

    const mine = within(await alertBox("My own warning"));
    expect(mine.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/sites/7/warnings/12/edit",
    );
    expect(mine.getByRole("button", { name: "Delete" })).toBeInTheDocument();

    const theirs = within(await alertBox("Someone else's warning"));
    expect(theirs.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();
    expect(theirs.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("navigates to /sites/7/warnings/12/edit when pressing Edit", async () => {
    startSignedIn();
    serve(() => page([own]));
    server.use(http.get(`${origin}/api/v1/warnings/12`, () => HttpResponse.json(own)));
    renderRoute("/sites/7");

    const mine = within(await alertBox("My own warning"));
    await userEvent.click(mine.getByRole("link", { name: "Edit" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Edit warning" }),
    ).toBeInTheDocument();
  });

  it("deletes after confirmation and refreshes the warnings", async () => {
    startSignedIn();
    let deleted = false;
    const { urls } = serve(() => page(deleted ? [] : [own]));
    const deletes: string[] = [];
    server.use(
      http.delete(`${origin}/api/v1/warnings/12`, ({ request }) => {
        deletes.push(request.url);
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderRoute("/sites/7");
    const mine = within(await alertBox("My own warning"));
    const beforeRequests = urls.length;

    await userEvent.click(mine.getByRole("button", { name: "Delete" }));
    await userEvent.click(mine.getByRole("button", { name: "Yes, delete" }));

    await waitFor(() => expect(deletes).toHaveLength(1));
    await waitFor(() => expect(urls.length).toBeGreaterThan(beforeRequests));
    expect(
      await screen.findByText("No warnings have been reported for this site."),
    ).toBeInTheDocument();
  });

  it("sends no delete request when cancelled", async () => {
    startSignedIn();
    serve(() => page([own]));
    const deletes: string[] = [];
    server.use(
      http.delete(`${origin}/api/v1/warnings/12`, ({ request }) => {
        deletes.push(request.url);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderRoute("/sites/7");
    const mine = within(await alertBox("My own warning"));

    await userEvent.click(mine.getByRole("button", { name: "Delete" }));
    await userEvent.click(mine.getByRole("button", { name: "Cancel" }));

    expect(deletes).toHaveLength(0);
    expect(screen.getByText("My own warning")).toBeInTheDocument();
    expect(mine.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("shows an error alert when the delete request fails and keeps the warning", async () => {
    startSignedIn();
    serve(() => page([own]));
    server.use(
      http.delete(`${origin}/api/v1/warnings/12`, () =>
        HttpResponse.json(
          { status: 500 },
          { status: 500, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    );
    renderRoute("/sites/7");
    const mine = within(await alertBox("My own warning"));

    await userEvent.click(mine.getByRole("button", { name: "Delete" }));
    await userEvent.click(mine.getByRole("button", { name: "Yes, delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The warning could not be deleted.");
    expect(screen.getByText("My own warning")).toBeInTheDocument();
  });
});

describe("warning/site-warnings: Admins hide warnings on the site page", () => {
  const target = warning({
    id: 15,
    author: { id: 21, displayName: "Oleh Kravets" },
    text: "Spam warning",
  });
  const ADMIN = { ...MIRA, id: 99, displayName: "Admin User", role: "ADMIN" as const };

  it("hides after confirmation and refreshes the warnings", async () => {
    startSignedIn(ADMIN);
    let hidden = false;
    const { urls } = serve(() => page(hidden ? [] : [target]));
    const hides: string[] = [];
    server.use(
      http.post(`${origin}/api/v1/admin/warnings/15/hide`, ({ request }) => {
        hides.push(request.url);
        hidden = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderRoute("/sites/7");
    const box = within(await alertBox("Spam warning"));
    const beforeRequests = urls.length;

    await userEvent.click(box.getByRole("button", { name: "Hide" }));
    await userEvent.click(box.getByRole("button", { name: "Yes, hide" }));

    await waitFor(() => expect(hides).toHaveLength(1));
    await waitFor(() => expect(urls.length).toBeGreaterThan(beforeRequests));
    expect(
      await screen.findByText("No warnings have been reported for this site."),
    ).toBeInTheDocument();
  });

  it("sends no hide request when cancelled", async () => {
    startSignedIn(ADMIN);
    serve(() => page([target]));
    const hides: string[] = [];
    server.use(
      http.post(`${origin}/api/v1/admin/warnings/15/hide`, ({ request }) => {
        hides.push(request.url);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderRoute("/sites/7");
    const box = within(await alertBox("Spam warning"));

    await userEvent.click(box.getByRole("button", { name: "Hide" }));
    await userEvent.click(box.getByRole("button", { name: "Cancel" }));

    expect(hides).toHaveLength(0);
    expect(screen.getByText("Spam warning")).toBeInTheDocument();
    expect(box.getByRole("button", { name: "Hide" })).toBeInTheDocument();
  });

  it("shows no Hide button for a non-admin user", async () => {
    startSignedIn();
    serve(() => page([target]));
    renderRoute("/sites/7");

    const box = within(await alertBox("Spam warning"));
    expect(box.queryByRole("button", { name: "Hide" })).not.toBeInTheDocument();
  });
});
