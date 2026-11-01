import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { startSignedIn } from "../../test/auth";
import { renderRoute } from "../../test/render";
import { server } from "../../test/server";
import type { PostSummary } from "./api";

const origin = window.location.origin;
const posts = `${origin}/api/v1/posts`;

const summary = (overrides: Partial<PostSummary> = {}): PostSummary => ({
  id: 5,
  title: "Night dive",
  excerpt: "We entered at sunset",
  status: "PUBLISHED",
  readMinutes: 3,
  publishedAt: "2026-05-14T10:00:00Z",
  updatedAt: "2026-05-14T10:00:00Z",
  author: { id: 21, displayName: "Oleh Kravets" },
  ...overrides,
});

const pageOf = (content: PostSummary[], number = 0, totalPages = 1, totalElements?: number) => ({
  content,
  page: { number, size: 20, totalElements: totalElements ?? content.length, totalPages },
});

const COUNTRIES = [
  {
    code: "EG",
    name: "Egypt",
    regions: [
      { code: "eg-dahab", name: "Dahab" },
      { code: "eg-hurghada", name: "Hurghada" },
    ],
  },
  { code: "HR", name: "Croatia", regions: [{ code: "hr-istria", name: "Istria" }] },
];

/** Serves the feed, and records each request's query string. */
function serveFeed(respond: (query: URLSearchParams) => unknown = () => pageOf([summary()])) {
  const queries: URLSearchParams[] = [];
  server.use(
    http.get(`${origin}/api/v1/countries`, () => HttpResponse.json(COUNTRIES)),
    http.get(posts, ({ request }) => {
      const query = new URL(request.url).searchParams;
      queries.push(query);
      return HttpResponse.json(respond(query) as object);
    }),
  );
  return queries;
}

const last = <T,>(items: T[]) => items[items.length - 1];

describe("post/feed: The Feed page shows the posts", () => {
  it("shows cards with links to the post and the author", async () => {
    serveFeed(() =>
      pageOf([summary({ regionCode: "eg-dahab", site: { id: 7, name: "Blue Hole" } })]),
    );
    renderRoute("/feed");

    expect(await screen.findByRole("link", { name: "Night dive" })).toHaveAttribute(
      "href",
      "/posts/5",
    );
    expect(screen.getByRole("link", { name: "Oleh Kravets" })).toHaveAttribute("href", "/users/21");
    expect(screen.getByText("We entered at sunset")).toBeInTheDocument();
    expect(screen.getByText("Dahab", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Blue Hole" })).toBeInTheDocument();
    expect(screen.getByText(/14 May 2026 · 3 min read/)).toBeInTheDocument();
  });

  it("is linked from the main navigation", async () => {
    serveFeed();
    renderRoute("/feed");

    expect(await screen.findByRole("link", { name: "Feed" })).toHaveAttribute("href", "/feed");
  });

  it("pages, keeping the page in the URL", async () => {
    const queries = serveFeed((query) => {
      const page = Number(query.get("page") ?? 0);
      return pageOf([summary({ id: page + 1, title: `Post ${page}` })], page, 2);
    });
    renderRoute("/feed");

    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    await screen.findByRole("link", { name: "Post 0" });
    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByRole("link", { name: "Post 1" })).toBeInTheDocument();
    expect(last(queries)?.get("page")).toBe("1");
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    scrollTo.mockRestore();
  });

  it("opens the page held in the URL", async () => {
    const queries = serveFeed();
    renderRoute("/feed?page=3");

    await screen.findByRole("link", { name: "Night dive" });
    expect(last(queries)?.get("page")).toBe("2");
  });

  it("shows an empty message", async () => {
    serveFeed(() => pageOf([]));
    renderRoute("/feed");

    expect(await screen.findByText("No posts here yet.")).toBeInTheDocument();
  });

  it("shows an alert when loading fails", async () => {
    // A 400: the app retries server errors, which would outlast the assertion.
    server.use(
      http.get(posts, () =>
        HttpResponse.json(
          { status: 400 },
          { status: 400, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    );
    renderRoute("/feed");

    expect(await screen.findByRole("alert")).toHaveTextContent("could not be loaded");
  });
});

describe("post/feed: The Feed page filters by country and region", () => {
  it("filters by country, and limits the regions", async () => {
    const queries = serveFeed();
    renderRoute("/feed");
    const user = userEvent.setup();

    await screen.findByRole("option", { name: "Istria" });
    await user.selectOptions(screen.getByLabelText("Country"), "EG");

    await waitFor(() => expect(last(queries)?.get("countryCode")).toBe("EG"));
    expect(screen.queryByRole("option", { name: "Istria" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Dahab" })).toBeInTheDocument();
  });

  it("filters by region", async () => {
    const queries = serveFeed();
    renderRoute("/feed");
    const user = userEvent.setup();

    await screen.findByRole("option", { name: "Dahab" });
    await user.selectOptions(screen.getByLabelText("Region"), "eg-dahab");

    await waitFor(() => expect(last(queries)?.get("regionCode")).toBe("eg-dahab"));
    expect(screen.getByLabelText("Region")).toHaveValue("eg-dahab");
  });

  it("clears the region and page when the country changes", async () => {
    const queries = serveFeed();
    renderRoute("/feed?country=EG&region=eg-dahab&page=2");
    const user = userEvent.setup();

    await screen.findByRole("option", { name: "Croatia" });
    await user.selectOptions(screen.getByLabelText("Country"), "HR");

    await waitFor(() => expect(last(queries)?.get("countryCode")).toBe("HR"));
    expect(last(queries)?.get("regionCode")).toBeNull();
    expect(last(queries)?.get("page")).toBe("0");
    expect(screen.getByLabelText("Region")).toHaveValue("");
  });

  it("opens a filtered address", async () => {
    const queries = serveFeed();
    renderRoute("/feed?country=EG&region=eg-dahab");

    await screen.findByRole("option", { name: "Dahab" });
    await waitFor(() => expect(screen.getByLabelText("Region")).toHaveValue("eg-dahab"));
    expect(screen.getByLabelText("Country")).toHaveValue("EG");
    expect(queries[0]?.get("countryCode")).toBe("EG");
    expect(queries[0]?.get("regionCode")).toBe("eg-dahab");
  });

  it("names countries and regions in the active language", async () => {
    serveFeed(() => pageOf([summary({ regionCode: "eg-dahab" })]));
    renderRoute("/feed", { language: "uk" });

    expect(await screen.findByRole("option", { name: "Єгипет" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Дахаб" })).toBeInTheDocument();
    expect(await screen.findByText("Дахаб", { selector: "span" })).toBeInTheDocument();
  });
});

describe("post/feed: The Feed page can show one site's posts", () => {
  it("filters by the site, names it, and links back", async () => {
    const queries = serveFeed();
    server.use(
      http.get(`${origin}/api/v1/sites/7`, () =>
        HttpResponse.json({ id: 7, name: "Blue Hole", regionCode: "eg-dahab" }),
      ),
    );
    renderRoute("/feed?site=7");

    expect(await screen.findByText(/Posts about Blue Hole/)).toBeInTheDocument();
    expect(queries[0]?.get("siteId")).toBe("7");
    expect(screen.getByRole("link", { name: "See all posts" })).toHaveAttribute("href", "/feed");
  });
});

describe("post/feed: Signed-in users write from the feed and see their drafts", () => {
  function serveDrafts() {
    const state = { requested: false };
    server.use(
      http.get(`${posts}/drafts`, () => {
        state.requested = true;
        return HttpResponse.json(
          pageOf([summary({ id: 9, title: "Unfinished", status: "DRAFT" })]),
        );
      }),
    );
    return state;
  }

  it("shows the link and drafts when signed in", async () => {
    startSignedIn();
    serveFeed();
    serveDrafts();
    renderRoute("/feed");

    expect(await screen.findByRole("link", { name: "Write a post" })).toHaveAttribute(
      "href",
      "/posts/new",
    );
    expect(await screen.findByRole("link", { name: /Unfinished/ })).toHaveAttribute(
      "href",
      "/posts/9/edit",
    );
  });

  it("shows neither and requests no drafts when signed out", async () => {
    serveFeed();
    const state = serveDrafts();
    renderRoute("/feed");

    await screen.findByRole("link", { name: "Night dive" });
    expect(screen.queryByRole("link", { name: "Write a post" })).not.toBeInTheDocument();
    expect(state.requested).toBe(false);
  });
});

const site = (status = "APPROVED") => ({
  id: 7,
  name: "Blue Hole",
  countryCode: "EG",
  regionCode: "eg-dahab",
  latitude: 28,
  longitude: 34,
  minDepth: 5,
  maxDepth: 30,
  difficulty: 3,
  description: "A hole.",
  status,
  requiredGear: [],
  recommendedGear: [],
  photos: [],
  ratingCount: 0,
});

function serveSite(status: string, total: number) {
  const state = { requested: false };
  server.use(
    http.get(`${origin}/api/v1/sites/7`, () => HttpResponse.json(site(status))),
    http.get(posts, () => {
      state.requested = true;
      const content = Array.from({ length: Math.min(total, 3) }, (_, index) =>
        summary({ id: index + 1, title: `Post ${index}` }),
      );
      return HttpResponse.json(pageOf(content, 0, 1, total));
    }),
  );
  return state;
}

describe("site/details: The site page shows the posts about the site", () => {
  it("shows links to the posts", async () => {
    serveSite("APPROVED", 1);
    renderRoute("/sites/7");

    expect(
      await screen.findByRole("heading", { name: "Posts about this site" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Post 0/ })).toHaveAttribute("href", "/posts/1");
    expect(screen.getByText(/by Oleh Kravets · 14 May 2026/)).toBeInTheDocument();
  });

  it("links to the filtered feed when there are more than three", async () => {
    serveSite("APPROVED", 4);
    renderRoute("/sites/7");

    expect(await screen.findByRole("link", { name: "See all posts" })).toHaveAttribute(
      "href",
      "/feed?site=7",
    );
    expect(screen.getAllByRole("link", { name: /^Post \d/ })).toHaveLength(3);
  });

  it("offers no link for three or fewer", async () => {
    serveSite("APPROVED", 3);
    renderRoute("/sites/7");

    await screen.findByRole("heading", { name: "Posts about this site" });
    expect(screen.queryByRole("link", { name: "See all posts" })).not.toBeInTheDocument();
  });

  it("shows no section without posts", async () => {
    const state = serveSite("APPROVED", 0);
    renderRoute("/sites/7");

    await screen.findByRole("heading", { level: 1, name: "Blue Hole" });
    await waitFor(() => expect(state.requested).toBe(true));
    expect(
      screen.queryByRole("heading", { name: "Posts about this site" }),
    ).not.toBeInTheDocument();
  });

  it("makes no request for an unapproved site", async () => {
    const state = serveSite("PENDING", 1);
    renderRoute("/sites/7");

    await screen.findByText(/waiting for an admin/);
    expect(state.requested).toBe(false);
  });
});
