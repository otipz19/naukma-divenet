import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { authResponse } from "../../test/auth";
import { renderRoute } from "../../test/render";
import { server } from "../../test/server";

const registerUrl = `${window.location.origin}/api/v1/auth/register`;

async function fillIn({ password = "correct-horse" } = {}) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText("Display name"), "Mira Koval");
  await user.type(screen.getByLabelText("Email"), "mira@example.com");
  await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: "Create account" }));
}

describe("auth: The web app has a sign-up page", () => {
  it("shows the fields, the hint and the link to /login", async () => {
    renderRoute("/register");

    expect(await screen.findByRole("heading", { name: "Sign up" })).toBeInTheDocument();
    expect(screen.getByLabelText("Display name")).toHaveAccessibleDescription(
      "Shown on your reviews and posts.",
    );
    expect(within(screen.getByRole("main")).getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("sends nothing when the password is too short", async () => {
    let requests = 0;
    server.use(
      http.post(registerUrl, () => {
        requests += 1;
        return HttpResponse.json(authResponse(), { status: 201 });
      }),
    );
    renderRoute("/register");

    await fillIn({ password: "short" });

    const password = screen.getByLabelText("Password");
    await waitFor(() => expect(password).toHaveAttribute("aria-invalid", "true"));
    expect(password).toHaveAccessibleDescription("Must be at least 8 characters.");
    expect(requests).toBe(0);
  });

  it("shows a server field error under its field", async () => {
    server.use(
      http.post(registerUrl, () =>
        HttpResponse.json(
          {
            status: 400,
            errors: [{ field: "email", message: "must be a well-formed email address" }],
          },
          { status: 400, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    );
    renderRoute("/register");

    await fillIn();

    const email = screen.getByLabelText("Email");
    await waitFor(() => expect(email).toHaveAttribute("aria-invalid", "true"));
    expect(email).toHaveAccessibleDescription(
      "Enter a valid email address of at most 254 characters.",
    );
    expect(screen.queryByText("must be a well-formed email address")).not.toBeInTheDocument();
  });

  it("shows a taken email under the email field", async () => {
    server.use(
      http.post(registerUrl, () =>
        HttpResponse.json(
          { status: 409 },
          { status: 409, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    );
    renderRoute("/register");

    await fillIn();

    await waitFor(() =>
      expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
        "This email is already registered. Log in instead.",
      ),
    );
  });

  it("signs the new user in and goes to /", async () => {
    server.use(http.post(registerUrl, () => HttpResponse.json(authResponse(), { status: 201 })));
    renderRoute("/register");

    await fillIn();

    expect(await screen.findByText("The dive-site map is coming soon.")).toBeInTheDocument();
    expect(
      within(screen.getByRole("banner")).getByRole("button", { name: /Mira Koval/ }),
    ).toBeInTheDocument();
  });
});
