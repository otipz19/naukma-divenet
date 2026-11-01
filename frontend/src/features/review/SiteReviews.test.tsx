import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import type { components } from "../../api/schema.gen";
import { startSignedIn } from "../../test/auth";
import { renderRoute } from "../../test/render";
import { server } from "../../test/server";
import type { Review } from "./api";

const origin = window.location.origin;
const siteUrl = `${origin}/api/v1/sites/7`;
const reviewsUrl = `${origin}/api/v1/sites/7/reviews`;

const site = (
  status: "APPROVED" | "PENDING" = "APPROVED",
): components["schemas"]["SiteResponse"] => ({
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
  status,
});

const review = (overrides: Partial<Review> = {}): Review => ({
  id: 1,
  siteId: 7,
  author: { id: 21, displayName: "Oleh Kravets" },
  rating: 5,
  text: "Best wall in Dahab.",
  photos: [],
  createdAt: "2026-05-12T10:00:00Z",
  updatedAt: "2026-05-12T10:00:00Z",
  ...overrides,
});

const page = (content: Review[], number = 0, totalPages = 1, totalElements = content.length) => ({
  content,
  page: { size: 10, number, totalElements, totalPages },
});

/** Serves the site, answers the reviews from a function of the request's URL, and records each URL. */
function serve(
  answer: (url: URL) => ReturnType<typeof page>,
  status: "APPROVED" | "PENDING" = "APPROVED",
) {
  const urls: URL[] = [];
  const siteRequests: string[] = [];
  server.use(
    http.get(siteUrl, ({ request }) => {
      siteRequests.push(request.url);
      return HttpResponse.json(site(status));
    }),
    http.get(reviewsUrl, ({ request }) => {
      const url = new URL(request.url);
      urls.push(url);
      return HttpResponse.json(answer(url));
    }),
    http.get(`${reviewsUrl}/mine`, () =>
      HttpResponse.json(
        { status: 404 },
        { status: 404, headers: { "Content-Type": "application/problem+json" } },
      ),
    ),
  );
  return { urls, siteRequests };
}

const card = async (name: string) =>
  (await screen.findByText(name)).closest("article") as HTMLElement;

describe("review/site-reviews: The site page lists the site's reviews", () => {
  it("shows a review card", async () => {
    const photo = {
      id: "00000000-0000-4000-8000-000000000001",
      url: "/media/00000000-0000-4000-8000-000000000001",
      thumbnailUrl: "/media/00000000-0000-4000-8000-000000000001/thumb",
      width: 1200,
      height: 800,
    };
    serve(() => page([review({ photos: [photo] })]));
    renderRoute("/sites/7");

    const article = within(await card("Oleh Kravets"));
    expect(article.getByText("OK")).toBeInTheDocument();
    expect(article.getByText("12 May 2026")).toBeInTheDocument();
    expect(article.getByRole("img", { name: "Rated 5 out of 5" })).toBeInTheDocument();
    expect(article.getByText("Best wall in Dahab.")).toBeInTheDocument();
    const thumbnail = article.getByRole("img", { name: "Photo 1 by Oleh Kravets" });
    expect(thumbnail).toHaveAttribute("src", photo.thumbnailUrl);
    expect(thumbnail.closest("a")).toHaveAttribute("href", photo.url);
    expect(screen.getByRole("heading", { name: /Reviews/ })).toHaveTextContent("Reviews1");
  });

  it("shows no rating on a text-only review", async () => {
    serve(() => page([review({ rating: undefined })]));
    renderRoute("/sites/7");

    const article = within(await card("Oleh Kravets"));
    expect(article.queryByRole("img", { name: /Rated/ })).not.toBeInTheDocument();
  });

  it("formats the date for Ukrainian", async () => {
    serve(() => page([review()]));
    renderRoute("/sites/7", { language: "uk" });

    const article = within(await card("Oleh Kravets"));
    expect(
      article.getByText(
        new Intl.DateTimeFormat("uk", { day: "numeric", month: "long", year: "numeric" }).format(
          new Date("2026-05-12T10:00:00Z"),
        ),
      ),
    ).toBeInTheDocument();
    expect(article.getByText(/травня/)).toBeInTheDocument();
  });

  it("says when there are no reviews", async () => {
    serve(() => page([]));
    renderRoute("/sites/7", { language: "uk" });

    expect(await screen.findByText("Відгуків ще немає. Напишіть перший.")).toBeInTheDocument();
  });

  it("shows no section and sends no request for a pending site", async () => {
    const { urls } = serve(() => page([]), "PENDING");
    renderRoute("/sites/7");

    await screen.findByRole("heading", { level: 1, name: "Blue Hole" });
    expect(screen.queryByRole("heading", { name: /Reviews/ })).not.toBeInTheDocument();
    expect(urls).toHaveLength(0);
  });
});

describe("review/site-reviews: Reviews can be sorted and loaded in pages", () => {
  it("sorts by rating", async () => {
    const { urls } = serve((url) =>
      url.searchParams.get("sort") === "rating"
        ? page([review({ id: 2, author: { id: 22, displayName: "Top Rater" } })])
        : page([review()]),
    );
    renderRoute("/sites/7");
    await card("Oleh Kravets");

    await userEvent.selectOptions(screen.getByLabelText("Sort reviews"), "Highest rated");

    expect(await screen.findByText("Top Rater")).toBeInTheDocument();
    expect(urls[urls.length - 1]!.searchParams.get("sort")).toBe("rating");
    expect(screen.queryByText("Oleh Kravets")).not.toBeInTheDocument();
  });

  it("loads more reviews until the last page", async () => {
    const { urls } = serve((url) =>
      url.searchParams.get("page") === "1"
        ? page([review({ id: 2, author: { id: 22, displayName: "Second Page" } })], 1, 2, 11)
        : page([review()], 0, 2, 11),
    );
    renderRoute("/sites/7");
    await card("Oleh Kravets");

    await userEvent.click(screen.getByRole("button", { name: "Load more reviews" }));

    expect(await screen.findByText("Second Page")).toBeInTheDocument();
    expect(screen.getByText("Oleh Kravets")).toBeInTheDocument();
    expect(
      screen.getByText("Oleh Kravets").compareDocumentPosition(screen.getByText("Second Page")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(urls[urls.length - 1]!.searchParams.get("page")).toBe("1");
    expect(screen.queryByRole("button", { name: "Load more reviews" })).not.toBeInTheDocument();
  });
});

describe("review/site-reviews: The user manages their own review on the site page", () => {
  const own = review({ id: 3, author: { id: 7, displayName: "Mira Koval" }, rating: undefined });

  it("marks the own review and gives only it Edit and Delete", async () => {
    startSignedIn();
    serve(() => page([review(), own]));
    renderRoute("/sites/7");

    const mine = within(await card("Mira Koval"));
    expect(mine.getByText("(you)")).toBeInTheDocument();
    expect(mine.getByRole("link", { name: "Edit" })).toHaveAttribute("href", "/sites/7/review");
    expect(mine.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    const other = within(await card("Oleh Kravets"));
    expect(other.queryByText("(you)")).not.toBeInTheDocument();
    expect(other.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();
    expect(other.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("opens the review form from Edit", async () => {
    startSignedIn();
    serve(() => page([own]));
    server.use(http.get(`${reviewsUrl}/mine`, () => HttpResponse.json(own)));
    renderRoute("/sites/7");

    await userEvent.click(within(await card("Mira Koval")).getByRole("link", { name: "Edit" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Edit your review" }),
    ).toBeInTheDocument();
  });

  it("deletes after confirmation and refreshes the reviews and the rating", async () => {
    startSignedIn();
    let deleted = false;
    const { urls, siteRequests } = serve(() => page(deleted ? [] : [own]));
    const deletes: string[] = [];
    server.use(
      http.delete(`${origin}/api/v1/reviews/3`, ({ request }) => {
        deletes.push(request.url);
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderRoute("/sites/7");
    const mine = within(await card("Mira Koval"));
    const reviewRequests = urls.length;
    const siteLoads = siteRequests.length;

    await userEvent.click(mine.getByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Yes, delete" }));

    await waitFor(() => expect(deletes).toHaveLength(1));
    await waitFor(() => expect(urls.length).toBeGreaterThan(reviewRequests));
    await waitFor(() => expect(siteRequests.length).toBeGreaterThan(siteLoads));
    expect(
      await screen.findByText("No reviews yet. Be the first to write one."),
    ).toBeInTheDocument();
  });

  it("keeps the review when the deletion is cancelled", async () => {
    startSignedIn();
    serve(() => page([own]));
    const deletes: string[] = [];
    server.use(
      http.delete(`${origin}/api/v1/reviews/3`, ({ request }) => {
        deletes.push(request.url);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderRoute("/sites/7");
    const mine = within(await card("Mira Koval"));

    await userEvent.click(mine.getByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(deletes).toHaveLength(0);
    expect(screen.getByText("Mira Koval")).toBeInTheDocument();
    expect(mine.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("shows an alert when the deletion fails", async () => {
    startSignedIn();
    serve(() => page([own]));
    server.use(
      http.delete(`${origin}/api/v1/reviews/3`, () =>
        HttpResponse.json(
          { status: 500 },
          { status: 500, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    );
    renderRoute("/sites/7");
    const mine = within(await card("Mira Koval"));

    await userEvent.click(mine.getByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Yes, delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The review could not be deleted.");
    expect(screen.getByText("Mira Koval")).toBeInTheDocument();
  });
});

describe("review/site-reviews: A review's author links to their profile", () => {
  it("shows the avatar and links the name", async () => {
    const author = { id: 21, displayName: "Oleh Kravets", avatarUrl: "/media/a1/thumb" };
    serve(() => page([review({ author })]));
    const { container } = renderRoute("/sites/7");

    const link = await screen.findByRole("link", { name: "Oleh Kravets" });
    expect(link).toHaveAttribute("href", "/users/21");
    expect(container.querySelector('article img[src="/media/a1/thumb"]')).not.toBeNull();
  });

  it("shows the initials without an avatar", async () => {
    serve(() => page([review()]));
    renderRoute("/sites/7");

    expect(await screen.findByRole("link", { name: "Oleh Kravets" })).toHaveAttribute(
      "href",
      "/users/21",
    );
    expect(screen.getByText("OK")).toBeInTheDocument();
  });
});
