import { screen, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import type { components } from "../../api/schema.gen";
import { startSignedIn } from "../../test/auth";
import { renderRoute } from "../../test/render";
import { server } from "../../test/server";
import { formatCoordinates } from "./SitePage";

const siteUrl = `${window.location.origin}/api/v1/sites/7`;

const blueHole = (overrides: Partial<components["schemas"]["SiteResponse"]> = {}) => ({
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
  requiredGear: ["torch"],
  recommendedGear: ["nitrox"],
  ratingCount: 0,
  reviewCount: 0,
  status: "APPROVED" as const,
  ...overrides,
});

const siteReturns = (site = blueHole()) =>
  server.use(http.get(siteUrl, () => HttpResponse.json(site)));

const problem = (status: number) =>
  HttpResponse.json(
    { status },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );

describe("site/details: The site page shows the site's facts", () => {
  it("shows the facts", async () => {
    siteReturns();
    renderRoute("/sites/7");

    expect(await screen.findByRole("heading", { level: 1, name: "Blue Hole" })).toBeInTheDocument();
    expect(screen.getByText("28.5722° N, 34.5375° E · Egypt, Dahab")).toBeInTheDocument();
    expect(screen.getByText("Advanced")).toBeInTheDocument();
    expect(screen.getByText("6–40 m")).toBeInTheDocument();
    expect(screen.getByText("A famous sinkhole.")).toBeInTheDocument();
    expect(screen.getByText("Torch")).toBeInTheDocument();
    expect(screen.getByText("Nitrox")).toBeInTheDocument();
  });

  it("formats southern and western coordinates", () => {
    expect(formatCoordinates(-8.5, -80.25)).toBe("8.5000° S, 80.2500° W");
  });

  it("uses the active language", async () => {
    siteReturns();
    renderRoute("/sites/7", { language: "uk" });

    expect(await screen.findByText("Ліхтар")).toBeInTheDocument();
    expect(screen.getByText("Просунутий")).toBeInTheDocument();
    expect(screen.getByText(/Єгипет, Дахаб/)).toBeInTheDocument();
  });

  it("hides the gear headings of a site with no gear", async () => {
    siteReturns(blueHole({ requiredGear: [], recommendedGear: [] }));
    renderRoute("/sites/7");

    await screen.findByRole("heading", { level: 1, name: "Blue Hole" });
    expect(screen.queryByText("Required gear")).not.toBeInTheDocument();
    expect(screen.queryByText("Recommended gear")).not.toBeInTheDocument();
  });
});

describe("site/details: The site page shows the safety disclaimer", () => {
  it("has the disclaimer in main, with no dismiss control", async () => {
    siteReturns();
    renderRoute("/sites/7");

    await screen.findByRole("heading", { level: 1, name: "Blue Hole" });
    const main = within(screen.getByRole("main"));
    expect(main.getByText(/does not replace dive planning/)).toBeInTheDocument();
    expect(main.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("site/details: The site page links back to the map", () => {
  it("has a breadcrumb link to /", async () => {
    siteReturns();
    renderRoute("/sites/7");

    const breadcrumb = await screen.findByRole("navigation", { name: "Breadcrumb" });
    expect(within(breadcrumb).getByRole("link", { name: "Map" })).toHaveAttribute("href", "/");
  });
});

describe("site/details: The site page handles a missing site and a failed load", () => {
  it("shows not-found on a 404", async () => {
    server.use(http.get(siteUrl, () => problem(404)));
    renderRoute("/sites/7");

    expect(await screen.findByRole("heading", { name: "Site not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the map" })).toHaveAttribute("href", "/");
  });

  it("shows not-found for an id that is not a number", () => {
    renderRoute("/sites/abc");

    expect(screen.getByRole("heading", { name: "Site not found" })).toBeInTheDocument();
  });

  it("shows an alert on a server error", async () => {
    server.use(http.get(siteUrl, () => problem(500)));
    renderRoute("/sites/7");

    expect(await screen.findByRole("alert", {}, { timeout: 8000 })).toHaveTextContent(
      "This site could not be loaded.",
    );
  }, 10000);
});

describe("site/details: The site page shows an unapproved site's status", () => {
  it("shows the pending notice", async () => {
    siteReturns(blueHole({ status: "PENDING" }));
    renderRoute("/sites/7");

    expect(await screen.findByText(/waiting for an admin/)).toBeInTheDocument();
  });

  it("shows the rejected notice with the reason", async () => {
    siteReturns(blueHole({ status: "REJECTED", rejectionReason: "Duplicate of Canyon" }));
    renderRoute("/sites/7");

    expect(await screen.findByText("Rejected by an admin")).toBeInTheDocument();
    expect(screen.getByText("Duplicate of Canyon")).toBeInTheDocument();
  });

  it("shows no notice for an approved site", async () => {
    siteReturns();
    renderRoute("/sites/7");

    await screen.findByRole("heading", { level: 1, name: "Blue Hole" });
    expect(screen.queryByText(/waiting for an admin/)).not.toBeInTheDocument();
    expect(screen.queryByText("Rejected by an admin")).not.toBeInTheDocument();
  });
});

describe("site/details: The site page waits for the session", () => {
  it("sends the token when the author reloads", async () => {
    startSignedIn();
    const tokens: (string | null)[] = [];
    server.use(
      http.get(siteUrl, ({ request }) => {
        const token = request.headers.get("Authorization");
        tokens.push(token);
        return token ? HttpResponse.json(blueHole({ status: "PENDING" })) : problem(404);
      }),
    );
    renderRoute("/sites/7");

    expect(await screen.findByRole("heading", { level: 1, name: "Blue Hole" })).toBeInTheDocument();
    expect(tokens).toEqual(["Bearer token-1"]);
  });
});

const mineUrl = `${window.location.origin}/api/v1/sites/7/reviews/mine`;

describe("site/details: The facts card shows the community view", () => {
  it("shows the rating and the community difficulty of a rated site", async () => {
    siteReturns(blueHole({ averageRating: 4.9, ratingCount: 342, communityDifficulty: 3.6 }));
    renderRoute("/sites/7");

    const facts = await screen.findByRole("group", { name: "Site facts" });
    expect(
      within(facts).getByRole("img", { name: "Rated 4.9 out of 5, 342 ratings" }),
    ).toBeInTheDocument();
    const community = within(facts).getByText("Community").parentElement!;
    expect(within(community).getByText("Advanced")).toBeInTheDocument();
  });

  it("shows the no-ratings text and a dash for a site without reviews", async () => {
    siteReturns(blueHole({ ratingCount: 0, reviewCount: 0 }));
    renderRoute("/sites/7");

    const facts = await screen.findByRole("group", { name: "Site facts" });
    expect(within(facts).getByText("No ratings yet")).toBeInTheDocument();
    const community = within(facts).getByText("Community").parentElement!;
    expect(within(community).getByText("—")).toBeInTheDocument();
  });
});

describe("site/details: The site page offers to write or edit a review", () => {
  it("offers an anonymous visitor to write a review", async () => {
    siteReturns();
    renderRoute("/sites/7");

    expect(await screen.findByRole("link", { name: "Write a review" })).toHaveAttribute(
      "href",
      "/sites/7/review",
    );
  });

  it("offers a signed-in user without a review to write one", async () => {
    startSignedIn();
    siteReturns();
    server.use(http.get(mineUrl, () => problem(404)));
    renderRoute("/sites/7");

    expect(await screen.findByRole("link", { name: "Write a review" })).toHaveAttribute(
      "href",
      "/sites/7/review",
    );
  });

  it("offers a user with a review to edit it", async () => {
    startSignedIn();
    siteReturns();
    server.use(
      http.get(mineUrl, () =>
        HttpResponse.json({
          id: 3,
          siteId: 7,
          author: { id: 7, displayName: "Mira Koval" },
          rating: 4,
          photos: [],
          createdAt: "2026-05-12T10:00:00Z",
          updatedAt: "2026-05-12T10:00:00Z",
        }),
      ),
    );
    renderRoute("/sites/7");

    expect(await screen.findByRole("link", { name: "Edit your review" })).toHaveAttribute(
      "href",
      "/sites/7/review",
    );
  });

  it("shows no review link on a pending site", async () => {
    siteReturns(blueHole({ status: "PENDING" }));
    renderRoute("/sites/7");

    await screen.findByRole("heading", { level: 1, name: "Blue Hole" });
    expect(screen.queryByRole("link", { name: "Write a review" })).not.toBeInTheDocument();
  });
});

describe("warning/site-warnings: Section placement and unapproved site", () => {
  it("places Recent warnings before About this site on an approved site", async () => {
    siteReturns();
    renderRoute("/sites/7");

    const warningsHeading = await screen.findByRole("heading", { name: "Recent warnings" });
    const aboutHeading = screen.getByRole("heading", { name: "About this site" });
    expect(
      warningsHeading.compareDocumentPosition(aboutHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows no warnings section and sends no warnings request on a pending site", async () => {
    const warningRequests: string[] = [];
    siteReturns(blueHole({ status: "PENDING" }));
    server.use(
      http.get(`${window.location.origin}/api/v1/sites/7/warnings`, ({ request }) => {
        warningRequests.push(request.url);
        return HttpResponse.json({
          content: [],
          page: { size: 10, number: 0, totalElements: 0, totalPages: 0 },
        });
      }),
    );
    renderRoute("/sites/7");

    await screen.findByRole("heading", { level: 1, name: "Blue Hole" });
    expect(screen.queryByRole("heading", { name: "Recent warnings" })).not.toBeInTheDocument();
    expect(warningRequests).toHaveLength(0);
  });
});
