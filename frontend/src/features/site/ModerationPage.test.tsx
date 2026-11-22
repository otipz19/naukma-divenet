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

  it("Account menu: has no link to the moderation page for an admin", async () => {
    startSignedIn(ADMIN);
    renderRoute("/");
    await userEvent.click(await screen.findByRole("button", { name: /Mira Koval/ }));

    const items = within(screen.getByRole("menu")).getAllByRole("menuitem");
    expect(items.some((menuItem) => menuItem.getAttribute("href") === "/admin/moderation")).toBe(
      false,
    );
  });
});

const certificatesUrl = `${origin}/api/v1/admin/certificates`;
const nav = () =>
  within(within(screen.getByRole("banner")).getByRole("navigation", { name: "Main" }));

/** `sites` pending sites (ids 9, 10, ...) until each is approved, and `certificates` pending certificates. */
function pending(sites: number, certificates: number) {
  const approved = new Set<number>();
  const answered = { sites: 0, certificates: 0 };
  const items = Array.from({ length: sites }, (_, index) => ({
    ...item,
    site: { ...item.site, id: 9 + index, name: `Reef ${index + 1}` },
  }));
  server.use(
    http.get(queueUrl, () => {
      const content = items.filter((entry) => !approved.has(entry.site.id));
      answered.sites += 1;
      return HttpResponse.json({
        content,
        page: { number: 0, size: 20, totalElements: content.length, totalPages: 1 },
      });
    }),
    http.get(certificatesUrl, () => {
      answered.certificates += 1;
      return HttpResponse.json({
        content: [],
        page: { number: 0, size: 20, totalElements: certificates, totalPages: 1 },
      });
    }),
    http.post(`${queueUrl}/:id/approve`, ({ params }) => {
      approved.add(Number(params.id));
      return HttpResponse.json(item.site);
    }),
  );
  return answered;
}

describe("site/moderation: The header's Moderation entry shows the pending count", () => {
  it("Navigation entry: links to the page with a badge of 3 for 2 sites and 1 certificate", async () => {
    pending(2, 1);
    startSignedIn(ADMIN);
    renderRoute("/");

    const link = await nav().findByRole("link", { name: "Moderation, 3 pending" });
    expect(link).toHaveAttribute("href", "/admin/moderation");
    expect(within(link).getByText("3")).toBeInTheDocument();
  });

  it("Nothing pending: shows no badge", async () => {
    const answered = pending(0, 0);
    startSignedIn(ADMIN);
    renderRoute("/");

    const link = await nav().findByRole("link", { name: "Moderation" });
    await waitFor(() => expect(answered).toEqual({ sites: 1, certificates: 1 }));
    expect(link).toHaveAccessibleName("Moderation");
    expect(link).toHaveTextContent(/^Moderation$/);
  });

  it("names the count in Ukrainian", async () => {
    pending(2, 1);
    startSignedIn(ADMIN);
    renderRoute("/", { language: "uk" });

    const ukNav = within(
      within(screen.getByRole("banner")).getByRole("navigation", { name: "Основна" }),
    );
    expect(
      await ukNav.findByRole("link", { name: "Модерація, 3 очікують розгляду" }),
    ).toBeInTheDocument();
  });

  it("Current page: marks the entry on /admin/moderation", async () => {
    pending(1, 0);
    startSignedIn(ADMIN);
    renderRoute("/admin/moderation");

    expect(await nav().findByRole("link", { name: /^Moderation/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("Count follows moderation: approving one of 3 items shows 2", async () => {
    pending(2, 1);
    startSignedIn(ADMIN);
    renderRoute("/admin/moderation");
    await nav().findByRole("link", { name: "Moderation, 3 pending" });

    const [approve] = await screen.findAllByRole("button", { name: "Approve" });
    await userEvent.click(approve!);

    expect(await nav().findByRole("link", { name: "Moderation, 2 pending" })).toBeInTheDocument();
  });

  it("Not for divers: no link to the page and no admin request", async () => {
    const adminRequests: string[] = [];
    const record = ({ request }: { request: Request }) => {
      if (new URL(request.url).pathname.startsWith("/api/v1/admin/")) {
        adminRequests.push(request.url);
      }
    };
    server.events.on("request:start", record);
    try {
      startSignedIn();
      renderRoute("/");
      await userEvent.click(await screen.findByRole("button", { name: /Mira Koval/ }));

      const links = [...screen.queryAllByRole("link"), ...screen.queryAllByRole("menuitem")];
      expect(links.some((link) => link.getAttribute("href") === "/admin/moderation")).toBe(false);
      expect(adminRequests).toHaveLength(0);
    } finally {
      server.events.removeListener("request:start", record);
    }
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
