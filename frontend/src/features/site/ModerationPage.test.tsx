import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { MIRA, startSignedIn } from "../../test/auth";
import { renderRoute } from "../../test/render";
import { server } from "../../test/server";

const origin = window.location.origin;
const queueUrl = `${origin}/api/v1/admin/sites`;
const ADMIN = { ...MIRA, role: "ADMIN" as const };

const item = {
  site: {
    id: 9,
    name: "New Reef",
    lat: 28.5,
    lng: 34.5,
    countryCode: "EG",
    regionCode: "eg-dahab",
    difficulty: 1,
    minDepth: 5,
    maxDepth: 20,
    description: "A reef.",
    requiredGear: [],
    recommendedGear: [],
    status: "PENDING",
  },
  authorName: "Oleh",
};

/** A queue that holds `item` until something moderates it. */
function queue() {
  const state = { moderated: false };
  server.use(
    http.get(queueUrl, () => {
      const content = state.moderated ? [] : [item];
      return HttpResponse.json({
        content,
        page: { number: 0, size: 20, totalElements: content.length, totalPages: 1 },
      });
    }),
  );
  return state;
}

describe("site/moderation: The moderation page is for admins", () => {
  it("does not request the queue for a non-admin", async () => {
    let requested = false;
    server.use(
      http.get(queueUrl, () => {
        requested = true;
        return HttpResponse.json({ content: [], page: {} });
      }),
    );
    startSignedIn();
    renderRoute("/admin/moderation");

    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(requested).toBe(false);
  });

  it("links admins, and only admins, from the account menu", async () => {
    startSignedIn(ADMIN);
    renderRoute("/");
    await userEvent.click(await screen.findByRole("button", { name: /Mira Koval/ }));

    expect(screen.getByRole("menuitem", { name: "Moderation" })).toHaveAttribute(
      "href",
      "/admin/moderation",
    );
  });

  it("hides the link from other users", async () => {
    startSignedIn();
    renderRoute("/");
    await userEvent.click(await screen.findByRole("button", { name: /Mira Koval/ }));

    expect(screen.queryByRole("menuitem", { name: "Moderation" })).not.toBeInTheDocument();
  });
});

describe("site/moderation: The moderation page approves and rejects", () => {
  it("shows the facts of a card", async () => {
    queue();
    startSignedIn(ADMIN);
    renderRoute("/admin/moderation");

    const card = within(
      (await screen.findByRole("heading", { name: "New Reef" })).closest("article")!,
    );
    expect(card.getByText("A reef.")).toBeInTheDocument();
    expect(card.getByText("Submitted by Oleh")).toBeInTheDocument();
    expect(card.getByText(/Egypt · Dahab/)).toBeInTheDocument();
    expect(card.getByRole("link", { name: "Open on OpenStreetMap" })).toHaveAttribute(
      "href",
      expect.stringContaining("mlat=28.5&mlon=34.5"),
    );
  });

  it("approves, and the card leaves the queue", async () => {
    const state = queue();
    server.use(
      http.post(`${queueUrl}/9/approve`, () => {
        state.moderated = true;
        return HttpResponse.json(item.site);
      }),
    );
    startSignedIn(ADMIN);
    renderRoute("/admin/moderation");

    await userEvent.click(await screen.findByRole("button", { name: "Approve" }));

    expect(await screen.findByText("Nothing is waiting for review.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "New Reef" })).not.toBeInTheDocument();
  });

  it("needs a reason to reject", async () => {
    let sent = false;
    queue();
    server.use(
      http.post(`${queueUrl}/9/reject`, () => {
        sent = true;
        return HttpResponse.json(item.site);
      }),
    );
    startSignedIn(ADMIN);
    renderRoute("/admin/moderation");

    await userEvent.click(await screen.findByRole("button", { name: "Reject" }));

    expect(await screen.findByText("Enter a reason to reject.")).toBeInTheDocument();
    expect(sent).toBe(false);
  });

  it("sends the reason, and the card leaves the queue", async () => {
    const state = queue();
    let body: unknown;
    server.use(
      http.post(`${queueUrl}/9/reject`, async ({ request }) => {
        body = await request.json();
        state.moderated = true;
        return HttpResponse.json(item.site);
      }),
    );
    startSignedIn(ADMIN);
    renderRoute("/admin/moderation");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Rejection reason"), "Duplicate");
    await user.click(screen.getByRole("button", { name: "Reject" }));

    await waitFor(() => expect(body).toEqual({ reason: "Duplicate" }));
    expect(await screen.findByText("Nothing is waiting for review.")).toBeInTheDocument();
  });

  it("shows the empty-queue text", async () => {
    const state = queue();
    state.moderated = true;
    startSignedIn(ADMIN);
    renderRoute("/admin/moderation", { language: "uk" });

    expect(await screen.findByText("Немає нічого на перевірку.")).toBeInTheDocument();
  });

  it("shows an alert and reloads the queue on a conflict", async () => {
    const state = queue();
    server.use(
      http.post(`${queueUrl}/9/approve`, () => {
        state.moderated = true;
        return HttpResponse.json(
          { status: 409 },
          { status: 409, headers: { "Content-Type": "application/problem+json" } },
        );
      }),
    );
    startSignedIn(ADMIN);
    renderRoute("/admin/moderation");

    await userEvent.click(await screen.findByRole("button", { name: "Approve" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("already been moderated");
    expect(await screen.findByText("Nothing is waiting for review.")).toBeInTheDocument();
  });
});
