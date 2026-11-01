import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import type { components } from "../../api/schema.gen";
import { authResponse, startSignedIn } from "../../test/auth";
import { renderRoute } from "../../test/render";
import { server } from "../../test/server";
import type { Review } from "./api";

const origin = window.location.origin;
const siteUrl = `${origin}/api/v1/sites/7`;
const mineUrl = `${origin}/api/v1/sites/7/reviews/mine`;
const createUrl = `${origin}/api/v1/sites/7/reviews`;

const problem = (status: number) =>
  HttpResponse.json(
    { status },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );

const site: components["schemas"]["SiteResponse"] = {
  id: 7,
  name: "SS Thistlegorm",
  lat: 27.8,
  lng: 33.9,
  countryCode: "EG",
  regionCode: "eg-dahab",
  difficulty: 2,
  minDepth: 16,
  maxDepth: 32,
  description: "A wreck.",
  requiredGear: [],
  recommendedGear: [],
  ratingCount: 0,
  reviewCount: 0,
  status: "APPROVED",
};

const photo = (n: number) => {
  const id = `00000000-0000-4000-8000-00000000000${n}`;
  return { id, url: `/media/${id}`, thumbnailUrl: `/media/${id}/thumb`, width: 1200, height: 800 };
};

const ownReview: Review = {
  id: 3,
  siteId: 7,
  author: { id: 7, displayName: "Mira Koval" },
  rating: 3,
  difficulty: 4,
  text: "Strong current on the bow line.",
  photos: [photo(1)],
  createdAt: "2026-05-12T10:00:00Z",
  updatedAt: "2026-05-12T10:00:00Z",
};

/** Serves the site and the user's review (none by default); returns the bodies of review writes. */
function serve({ mine = null as Review | null, siteStatus = 200 } = {}) {
  const writes: { method: string; url: string; body: Record<string, unknown> }[] = [];
  const record = async ({ request }: { request: Request }) => {
    writes.push({
      method: request.method,
      url: request.url,
      body: (await request.json()) as Record<string, unknown>,
    });
    return HttpResponse.json(
      { ...ownReview, id: 3 },
      { status: request.method === "POST" ? 201 : 200 },
    );
  };
  server.use(
    http.get(siteUrl, () => (siteStatus === 200 ? HttpResponse.json(site) : problem(siteStatus))),
    http.get(mineUrl, () => (mine ? HttpResponse.json(mine) : problem(404))),
    http.post(createUrl, record),
    http.put(`${origin}/api/v1/reviews/3`, record),
  );
  return writes;
}

const starsChecked = () =>
  screen
    .getAllByRole("radio")
    .filter((radio) => (radio as HTMLInputElement).checked)
    .map((radio) => radio.getAttribute("aria-label") ?? radio.parentElement?.textContent);

describe("review/review-form: The review form has the design's fields", () => {
  it("shows an empty form for a new review", async () => {
    startSignedIn();
    serve();
    renderRoute("/sites/7/review");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Write a review" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/SS Thistlegorm · Egypt, Dahab/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← Back to SS Thistlegorm" })).toHaveAttribute(
      "href",
      "/sites/7",
    );
    expect(starsChecked()).toEqual(["No rating"]);
    for (const word of ["Beginner", "Intermediate", "Advanced", "Technical"]) {
      expect(screen.getByRole("button", { name: word })).toHaveAttribute("aria-pressed", "false");
    }
    expect(screen.getByLabelText("Review")).toHaveValue("");
    expect(screen.queryByRole("img", { name: /Photo/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish review" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/sites/7");
  });

  it("sends an anonymous visitor to log in, then back to the form", async () => {
    serve();
    server.use(http.post(`${origin}/api/v1/auth/login`, () => HttpResponse.json(authResponse())));
    renderRoute("/sites/7/review");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Email"), "mira@example.com");
    await user.type(screen.getByLabelText("Password"), "correct-horse");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Write a review" }),
    ).toBeInTheDocument();
  });

  it("is in Ukrainian", async () => {
    startSignedIn();
    serve();
    renderRoute("/sites/7/review", { language: "uk" });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Написати відгук" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ваша оцінка")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Без оцінки" })).toBeChecked();
    expect(screen.getByText("Наскільки складним це було для вас?")).toBeInTheDocument();
    expect(screen.getByLabelText("Відгук")).toBeInTheDocument();
    expect(screen.getByText(/До 4000 символів/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Опублікувати відгук" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Скасувати" })).toBeInTheDocument();
  });

  it("shows not-found for an unknown or unapproved site", async () => {
    startSignedIn();
    serve({ siteStatus: 404 });
    renderRoute("/sites/7/review");

    expect(await screen.findByRole("heading", { name: "Site not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the map" })).toHaveAttribute("href", "/");
  });
});

describe("review/review-form: The form publishes a review", () => {
  it("publishes the rating, difficulty, text and photos, then returns to the site", async () => {
    startSignedIn();
    const writes = serve();
    server.use(
      http.post(`${origin}/api/v1/media`, () =>
        HttpResponse.json({ ...photo(2), contentType: "image/jpeg" }, { status: 201 }),
      ),
    );
    const view = renderRoute("/sites/7/review");
    const user = userEvent.setup({ applyAccept: false });
    await screen.findByRole("heading", { level: 1, name: "Write a review" });

    await user.click(screen.getByRole("radio", { name: "4 stars" }));
    await user.click(screen.getByRole("button", { name: "Intermediate" }));
    await user.type(screen.getByLabelText("Review"), "Calm in the morning.");
    const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(input, new File([new Uint8Array(16)], "deck.jpg", { type: "image/jpeg" }));
    await screen.findByRole("img", { name: "Photo 1" });
    await user.click(screen.getByRole("button", { name: "Publish review" }));

    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0]!.method).toBe("POST");
    expect(writes[0]!.body).toEqual({
      rating: 4,
      difficulty: 2,
      text: "Calm in the morning.",
      photoIds: [photo(2).id],
    });
    expect(
      await screen.findByRole("heading", { level: 1, name: "SS Thistlegorm" }),
    ).toBeInTheDocument();
  });

  it("sends no rating for No rating", async () => {
    startSignedIn();
    const writes = serve();
    renderRoute("/sites/7/review");
    const user = userEvent.setup();
    await screen.findByRole("heading", { level: 1, name: "Write a review" });

    await user.type(screen.getByLabelText("Review"), "Just a note.");
    await user.click(screen.getByRole("button", { name: "Publish review" }));

    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0]!.body).not.toHaveProperty("rating");
    expect(writes[0]!.body.text).toBe("Just a note.");
  });

  it("clears the difficulty when the pressed chip is pressed again", async () => {
    startSignedIn();
    const writes = serve();
    renderRoute("/sites/7/review");
    const user = userEvent.setup();
    await screen.findByRole("heading", { level: 1, name: "Write a review" });

    await user.click(screen.getByRole("radio", { name: "2 stars" }));
    await user.click(screen.getByRole("button", { name: "Technical" }));
    await user.click(screen.getByRole("button", { name: "Technical" }));
    await user.click(screen.getByRole("button", { name: "Publish review" }));

    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0]!.body).toEqual({ rating: 2, photoIds: [] });
  });
});

describe("review/review-form: The form refuses an empty review", () => {
  it("sends nothing without a rating or text", async () => {
    startSignedIn();
    const writes = serve();
    renderRoute("/sites/7/review");
    const user = userEvent.setup();
    await screen.findByRole("heading", { level: 1, name: "Write a review" });

    await user.type(screen.getByLabelText("Review"), "   ");
    await user.click(screen.getByRole("button", { name: "Publish review" }));

    expect(await screen.findByText("Give a rating or write a review.")).toBeInTheDocument();
    expect(writes).toHaveLength(0);
  });

  it("shows an alert and keeps the input when the server refuses", async () => {
    startSignedIn();
    serve();
    server.use(http.post(createUrl, () => problem(400)));
    renderRoute("/sites/7/review");
    const user = userEvent.setup();
    await screen.findByRole("heading", { level: 1, name: "Write a review" });

    await user.click(screen.getByRole("radio", { name: "5 stars" }));
    await user.type(screen.getByLabelText("Review"), "Great.");
    await user.click(screen.getByRole("button", { name: "Publish review" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The review could not be saved.");
    expect(screen.getByRole("radio", { name: "5 stars" })).toBeChecked();
    expect(screen.getByLabelText("Review")).toHaveValue("Great.");
  });
});

describe("review/review-form: The same form edits the own review", () => {
  it("loads the review", async () => {
    startSignedIn();
    serve({ mine: ownReview });
    renderRoute("/sites/7/review");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Edit your review" }),
    ).toBeInTheDocument();
    expect(starsChecked()).toEqual(["3 stars"]);
    expect(screen.getByRole("button", { name: "Advanced" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText("Review")).toHaveValue("Strong current on the bow line.");
    expect(screen.getByRole("img", { name: "Photo 1" })).toHaveAttribute(
      "src",
      photo(1).thumbnailUrl,
    );
    expect(screen.getByRole("button", { name: "Save review" })).toBeInTheDocument();
  });

  it("saves the changes to the same review", async () => {
    startSignedIn();
    const writes = serve({ mine: ownReview });
    renderRoute("/sites/7/review");
    const user = userEvent.setup();
    await screen.findByRole("heading", { level: 1, name: "Edit your review" });

    await user.click(screen.getByRole("radio", { name: "5 stars" }));
    await user.click(screen.getByRole("button", { name: "Save review" }));

    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0]!.method).toBe("PUT");
    expect(writes[0]!.url).toBe(`${origin}/api/v1/reviews/3`);
    expect(writes[0]!.body).toEqual({
      rating: 5,
      difficulty: 4,
      text: "Strong current on the bow line.",
      photoIds: [photo(1).id],
    });
    expect(
      await screen.findByRole("heading", { level: 1, name: "SS Thistlegorm" }),
    ).toBeInTheDocument();
  });
});
