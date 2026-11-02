import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { MIRA, startSignedIn } from "../../test/auth";
import { renderRoute } from "../../test/render";
import { server } from "../../test/server";

const origin = window.location.origin;
const write = `${origin}/api/v1/gear-locker`;

function serveProfile(id: number, initial: { id: number; name: string }[]) {
  const state = { items: initial, posted: false };
  server.use(
    http.get(`${origin}/api/v1/users/${id}`, () =>
      HttpResponse.json({
        id,
        displayName: "Oleh Kravets",
        showDiveLog: true,
        showStatistics: true,
        showCertificates: true,
      }),
    ),
    http.get(`${origin}/api/v1/users/${id}/gear-locker`, () => HttpResponse.json(state.items)),
    http.post(write, async ({ request }) => {
      state.posted = true;
      const { name } = (await request.json()) as { name: string };
      const item = { id: 50, name };
      state.items = [...state.items, item];
      return HttpResponse.json(item, { status: 201 });
    }),
    http.delete(`${write}/1`, () => {
      state.items = state.items.filter((item) => item.id !== 1);
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return state;
}

const TANK = { id: 1, name: "Steel tank" };

describe("user/profile: The profile page shows the gear locker", () => {
  it("shows a visitor the items, with no controls", async () => {
    serveProfile(21, [TANK]);
    renderRoute("/users/21");

    expect(await screen.findByText("Steel tank")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Gear locker" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Steel tank" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Item name")).not.toBeInTheDocument();
  });

  it("shows a visitor no section when empty", async () => {
    serveProfile(21, []);
    renderRoute("/users/21");

    await screen.findByRole("heading", { level: 1, name: "Oleh Kravets" });
    expect(screen.queryByRole("heading", { name: "Gear locker" })).not.toBeInTheDocument();
  });

  it("shows the owner an empty message and the form", async () => {
    startSignedIn();
    serveProfile(MIRA.id, []);
    renderRoute(`/users/${MIRA.id}`);

    expect(await screen.findByText("Nothing in your locker yet.")).toBeInTheDocument();
    expect(screen.getByLabelText("Item name")).toBeInTheDocument();
  });

  it("adds an item, and clears the field", async () => {
    startSignedIn();
    serveProfile(MIRA.id, []);
    renderRoute(`/users/${MIRA.id}`);
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Item name"), " Regulator ");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText("Regulator")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Item name")).toHaveValue(""));
  });

  it("shows a translated error for a blank name, and sends nothing", async () => {
    startSignedIn();
    const state = serveProfile(MIRA.id, []);
    renderRoute(`/users/${MIRA.id}`, { language: "uk" });

    await userEvent.click(await screen.findByRole("button", { name: "Додати" }));

    expect(await screen.findByText("Вкажіть назву.")).toBeInTheDocument();
    expect(state.posted).toBe(false);
  });

  it("removes an item", async () => {
    startSignedIn();
    serveProfile(MIRA.id, [TANK]);
    renderRoute(`/users/${MIRA.id}`);

    await userEvent.click(await screen.findByRole("button", { name: "Remove Steel tank" }));

    await waitFor(() => expect(screen.queryByText("Steel tank")).not.toBeInTheDocument());
  });

  it("shows an alert and keeps the name when adding fails", async () => {
    startSignedIn();
    serveProfile(MIRA.id, []);
    server.use(
      http.post(write, () =>
        HttpResponse.json(
          { status: 400 },
          { status: 400, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    );
    renderRoute(`/users/${MIRA.id}`);
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Item name"), "Regulator");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("could not be saved");
    expect(screen.getByLabelText("Item name")).toHaveValue("Regulator");
  });

  it("speaks Ukrainian", async () => {
    startSignedIn();
    serveProfile(MIRA.id, [TANK]);
    renderRoute(`/users/${MIRA.id}`, { language: "uk" });

    expect(await screen.findByRole("heading", { name: "Шафка спорядження" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Прибрати Steel tank" })).toBeInTheDocument();
  });
});
