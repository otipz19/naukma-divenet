import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { MIRA, startSignedIn } from "../../test/auth";
import { renderRoute } from "../../test/render";
import { server } from "../../test/server";
import type { Certificate } from "./certificates";

const origin = window.location.origin;
const write = `${origin}/api/v1/certificates`;
const mine = `${origin}/api/v1/users/${MIRA.id}/certificates`;

const cert = (overrides: Partial<Certificate> = {}): Certificate => ({
  id: 1,
  agency: "PADI",
  level: "Open Water",
  status: "PENDING",
  number: "A-1",
  ...overrides,
});

const serveMine = (...items: Certificate[]) =>
  server.use(http.get(mine, () => HttpResponse.json(items)));

const save = () => screen.getByRole("button", { name: "Save certificate" });

describe("user/certificates: The certificates page manages the user's certificates", () => {
  it("sends a signed-out visitor to the login page", async () => {
    renderRoute("/profile/certificates");

    expect(await screen.findByRole("heading", { name: "Log in" })).toBeInTheDocument();
  });

  it("lists statuses and a rejection reason", async () => {
    startSignedIn();
    serveMine(
      cert({ id: 1, status: "VERIFIED" }),
      cert({ id: 2, level: "Wreck", status: "REJECTED", rejectionReason: "Unreadable" }),
    );
    renderRoute("/profile/certificates");

    expect(await screen.findByText("Verified")).toBeInTheDocument();
    expect(screen.getByText("Rejected")).toBeInTheDocument();
    expect(screen.getByText("Rejected because: Unreadable")).toBeInTheDocument();
  });

  it("sends a new certificate, clears the form and refreshes", async () => {
    startSignedIn();
    let sent: unknown;
    server.use(
      http.get(mine, () => HttpResponse.json(sent ? [cert({ level: "Rescue" })] : [])),
      http.post(write, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(cert(), { status: 201 });
      }),
    );
    renderRoute("/profile/certificates");
    const user = userEvent.setup();

    await user.selectOptions(await screen.findByLabelText("Agency"), "SSI");
    await user.type(screen.getByLabelText("Level"), " Rescue ");
    await user.type(screen.getByLabelText("Certificate number"), "S-9");
    await user.click(save());

    expect(await screen.findByText("PADI Rescue")).toBeInTheDocument();
    expect(sent).toEqual({ agency: "SSI", level: "Rescue", number: "S-9" });
    expect(screen.getByLabelText("Level")).toHaveValue("");
  });

  it("shows field errors and sends nothing", async () => {
    startSignedIn();
    let sent = false;
    server.use(
      http.post(write, () => {
        sent = true;
        return HttpResponse.json(cert(), { status: 201 });
      }),
    );
    renderRoute("/profile/certificates", { language: "uk" });

    await userEvent.click(await screen.findByRole("button", { name: "Зберегти сертифікат" }));

    expect(await screen.findByText("Вкажіть рівень.")).toBeInTheDocument();
    expect(screen.getByText("Вкажіть номер.")).toBeInTheDocument();
    expect(sent).toBe(false);
  });

  it("warns when editing a verified certificate, and updates it", async () => {
    startSignedIn();
    serveMine(cert({ status: "VERIFIED" }));
    let sent: { level?: string } | undefined;
    server.use(
      http.put(`${write}/1`, async ({ request }) => {
        sent = (await request.json()) as { level?: string };
        return HttpResponse.json(cert());
      }),
    );
    renderRoute("/profile/certificates");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Edit PADI Open Water" }));
    expect(screen.getByText(/will need verifying again/)).toBeInTheDocument();
    const level = screen.getByLabelText("Level");
    expect(level).toHaveValue("Open Water");
    await user.clear(level);
    await user.type(level, "Instructor");
    await user.click(save());

    await waitFor(() => expect(sent?.level).toBe("Instructor"));
  });

  it("deletes after confirmation", async () => {
    startSignedIn();
    let deleted = false;
    server.use(
      http.get(mine, () => HttpResponse.json(deleted ? [] : [cert()])),
      http.delete(`${write}/1`, () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderRoute("/profile/certificates");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Delete PADI Open Water" }));
    expect(deleted).toBe(false);
    await user.click(screen.getByRole("button", { name: "Yes, delete" }));

    expect(await screen.findByText("No certificates yet.")).toBeInTheDocument();
  });

  it("shows an alert and keeps the values when saving fails", async () => {
    startSignedIn();
    server.use(http.post(write, () => HttpResponse.json({ status: 500 }, { status: 500 })));
    renderRoute("/profile/certificates");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Level"), "Rescue");
    await user.type(screen.getByLabelText("Certificate number"), "S-9");
    await user.click(save());

    expect(await screen.findByRole("alert")).toHaveTextContent("could not be saved");
    expect(screen.getByLabelText("Level")).toHaveValue("Rescue");
  });
});

function serveProfile(id: number, showCertificates: boolean, items: Certificate[]) {
  const state = { requested: false };
  server.use(
    http.get(`${origin}/api/v1/users/${id}`, () =>
      HttpResponse.json({
        id,
        displayName: "Oleh Kravets",
        showDiveLog: true,
        showStatistics: true,
        showCertificates,
      }),
    ),
    http.get(`${origin}/api/v1/users/${id}/certificates`, () => {
      state.requested = true;
      return HttpResponse.json(items);
    }),
  );
  return state;
}

describe("user/profile: The profile page shows certificates", () => {
  it("shows them with their status", async () => {
    serveProfile(21, true, [
      cert({ id: 1, status: "VERIFIED", number: undefined }),
      cert({ id: 2, level: "Wreck", number: undefined }),
    ]);
    renderRoute("/users/21");

    expect(await screen.findByRole("heading", { name: "Certificates" })).toBeInTheDocument();
    expect(screen.getByText("PADI Open Water")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByText("Pending verification")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Manage certificates" })).not.toBeInTheDocument();
  });

  it("shows the notice and makes no request when hidden", async () => {
    const state = serveProfile(21, false, [cert()]);
    renderRoute("/users/21", { language: "uk" });

    expect(
      await screen.findByText("Сертифікати приховано налаштуваннями приватності дайвера."),
    ).toBeInTheDocument();
    expect(state.requested).toBe(false);
  });

  it("shows the owner their hidden certificates and the link", async () => {
    startSignedIn();
    serveProfile(MIRA.id, false, [cert()]);
    renderRoute(`/users/${MIRA.id}`);

    expect(await screen.findByText("PADI Open Water")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Manage certificates" })).toHaveAttribute(
      "href",
      "/profile/certificates",
    );
  });

  it("shows an admin hidden certificates", async () => {
    startSignedIn({ ...MIRA, role: "ADMIN" });
    serveProfile(21, false, [cert()]);
    renderRoute("/users/21");

    expect(await screen.findByText("PADI Open Water")).toBeInTheDocument();
  });

  it("shows no section for another visitor when there are none", async () => {
    const state = serveProfile(21, true, []);
    renderRoute("/users/21");

    await screen.findByRole("heading", { level: 1, name: "Oleh Kravets" });
    await waitFor(() => expect(state.requested).toBe(true));
    expect(screen.queryByRole("heading", { name: "Certificates" })).not.toBeInTheDocument();
  });
});

const queueUrl = `${origin}/api/v1/admin/certificates`;
const ADMIN = { ...MIRA, role: "ADMIN" as const };
const item = {
  certificate: cert({
    photo: {
      id: "p1",
      url: "/media/p1",
      thumbnailUrl: "/media/p1/thumb",
      width: 40,
      height: 30,
    },
  }),
  holderId: 21,
  holderName: "Oleh Kravets",
};

function serveQueue() {
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

const openTab = () => renderRoute("/admin/moderation?tab=certificates");

describe("user/certificate-verification: The Certificates tab works through the queue", () => {
  it("shows a card's details", async () => {
    startSignedIn(ADMIN);
    serveQueue();
    openTab();

    const card = within(
      (await screen.findByRole("heading", { name: "PADI Open Water" })).closest("article")!,
    );
    expect(card.getByText("A-1")).toBeInTheDocument();
    expect(card.getByRole("link", { name: "Oleh Kravets" })).toHaveAttribute("href", "/users/21");
    expect(card.getByRole("img")).toHaveAttribute("src", "/media/p1/thumb");
  });

  it("verifies, and the card leaves the queue", async () => {
    startSignedIn(ADMIN);
    const state = serveQueue();
    server.use(
      http.post(`${queueUrl}/1/verify`, () => {
        state.moderated = true;
        return HttpResponse.json(cert({ status: "VERIFIED" }));
      }),
    );
    openTab();

    await userEvent.click(await screen.findByRole("button", { name: "Verify" }));

    expect(await screen.findByText("No certificates are waiting.")).toBeInTheDocument();
  });

  it("needs a reason to reject", async () => {
    startSignedIn(ADMIN);
    serveQueue();
    openTab();

    await userEvent.click(await screen.findByRole("button", { name: "Reject" }));

    expect(await screen.findByText("Enter a reason to reject.")).toBeInTheDocument();
  });

  it("sends the reason, and the card leaves the queue", async () => {
    startSignedIn(ADMIN);
    const state = serveQueue();
    let body: unknown;
    server.use(
      http.post(`${queueUrl}/1/reject`, async ({ request }) => {
        body = await request.json();
        state.moderated = true;
        return HttpResponse.json(cert({ status: "REJECTED" }));
      }),
    );
    openTab();
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Rejection reason"), "Unreadable");
    await user.click(screen.getByRole("button", { name: "Reject" }));

    expect(await screen.findByText("No certificates are waiting.")).toBeInTheDocument();
    expect(body).toEqual({ reason: "Unreadable" });
  });

  it("shows an alert and reloads on a conflict", async () => {
    startSignedIn(ADMIN);
    const state = serveQueue();
    server.use(
      http.post(`${queueUrl}/1/verify`, () => {
        state.moderated = true;
        return HttpResponse.json(
          { status: 409 },
          { status: 409, headers: { "Content-Type": "application/problem+json" } },
        );
      }),
    );
    openTab();

    await userEvent.click(await screen.findByRole("button", { name: "Verify" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("already been moderated");
    expect(await screen.findByText("No certificates are waiting.")).toBeInTheDocument();
  });

  it("shows the empty-queue text", async () => {
    startSignedIn(ADMIN);
    renderRoute("/admin/moderation?tab=certificates", { language: "uk" });

    expect(await screen.findByText("Немає сертифікатів на перевірку.")).toBeInTheDocument();
  });
});

describe("site/moderation: The moderation page has a tab for each queue", () => {
  it("selects Sites by default", async () => {
    startSignedIn(ADMIN);
    renderRoute("/admin/moderation");

    expect(await screen.findByRole("tab", { name: /Sites/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(await screen.findByText("Nothing is waiting for review.")).toBeInTheDocument();
  });

  it("switches tabs, with the pending count", async () => {
    startSignedIn(ADMIN);
    serveQueue();
    renderRoute("/admin/moderation");

    const tab = await screen.findByRole("tab", { name: /Certificates/ });
    await within(tab).findByText("1");
    await userEvent.click(tab);

    expect(tab).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByRole("heading", { name: "PADI Open Water" })).toBeInTheDocument();
  });

  it("opens a tab by URL, and moves with the arrow keys", async () => {
    startSignedIn(ADMIN);
    openTab();

    const tab = await screen.findByRole("tab", { name: /Certificates/ });
    expect(tab).toHaveAttribute("aria-selected", "true");

    tab.focus();
    await userEvent.keyboard("{ArrowLeft}");

    expect(screen.getByRole("tab", { name: /Sites/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /Sites/ })).toHaveFocus();
  });
});
