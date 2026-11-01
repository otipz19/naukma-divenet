import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { MIRA, startSignedIn } from "../../test/auth";
import { renderRoute } from "../../test/render";
import { server } from "../../test/server";

const origin = window.location.origin;
const meUrl = `${origin}/api/v1/users/me`;
const AVATAR = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

const current = {
  id: MIRA.id,
  displayName: MIRA.displayName,
  bio: "Old bio",
  avatar: {
    id: AVATAR,
    url: `/media/${AVATAR}`,
    thumbnailUrl: `/media/${AVATAR}/thumb`,
    width: 40,
    height: 30,
  },
  showDiveLog: true,
  showStatistics: true,
  showCertificates: false,
};

function serve() {
  startSignedIn();
  server.use(http.get(`${origin}/api/v1/users/${MIRA.id}`, () => HttpResponse.json(current)));
}

const save = () => screen.getByRole("button", { name: "Save" });

describe("user/profile: The edit page saves the profile", () => {
  it("sends a signed-out visitor to the login page", async () => {
    renderRoute("/profile/edit");

    expect(await screen.findByRole("heading", { name: "Log in" })).toBeInTheDocument();
  });

  it("shows the current values, saves the new ones and returns to the profile", async () => {
    serve();
    let sent: unknown;
    server.use(
      http.put(meUrl, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(current);
      }),
    );
    renderRoute("/profile/edit");
    const user = userEvent.setup();
    const bio = await screen.findByLabelText("Bio");
    expect(bio).toHaveValue("Old bio");
    expect(screen.getByLabelText("Show my certificates")).not.toBeChecked();

    await user.clear(bio);
    await user.type(bio, " New bio ");
    await user.click(screen.getByLabelText("Show my dive log"));
    await user.click(save());

    expect(
      await screen.findByRole("heading", { level: 1, name: MIRA.displayName }),
    ).toBeInTheDocument();
    expect(sent).toEqual({
      bio: "New bio",
      avatarId: AVATAR,
      showDiveLog: false,
      showStatistics: true,
      showCertificates: false,
    });
  });

  it("refuses a bio that is too long and sends nothing", async () => {
    serve();
    let sent = false;
    server.use(
      http.put(meUrl, () => {
        sent = true;
        return HttpResponse.json(current);
      }),
    );
    renderRoute("/profile/edit", { language: "uk" });
    const bio = await screen.findByLabelText("Про себе");

    await userEvent.click(bio);
    await userEvent.paste("x".repeat(501));
    await userEvent.click(screen.getByRole("button", { name: "Зберегти" }));

    expect(await screen.findByText("Не більше 500 символів.")).toBeInTheDocument();
    expect(sent).toBe(false);
  });

  it("shows an alert and keeps the values when saving fails", async () => {
    serve();
    server.use(
      http.put(meUrl, () =>
        HttpResponse.json(
          { status: 500 },
          { status: 500, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    );
    renderRoute("/profile/edit");
    const user = userEvent.setup();
    const bio = await screen.findByLabelText("Bio");

    await user.type(bio, " more");
    await user.click(save());

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("could not be saved"));
    expect(screen.getByLabelText("Bio")).toHaveValue("Old bio more");
  });
});
