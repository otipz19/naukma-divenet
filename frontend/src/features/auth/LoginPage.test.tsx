import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { authResponse, startSignedIn } from "../../test/auth";
import { renderRoute } from "../../test/render";
import { server } from "../../test/server";

const loginUrl = `${window.location.origin}/api/v1/auth/login`;
const problem = (status: number) =>
  HttpResponse.json(
    { status },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );

describe("auth: The web app has a login page", () => {
  it("shows the form, then signs in and goes to /", async () => {
    let sent: unknown;
    server.use(
      http.post(loginUrl, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(authResponse());
      }),
    );
    renderRoute("/login");
    const user = userEvent.setup();

    expect(await screen.findByRole("heading", { name: "Log in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      "/register",
    );
    await user.type(screen.getByLabelText("Email"), "mira@example.com");
    await user.type(screen.getByLabelText("Password"), "correct-horse");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("The dive-site map is coming soon.")).toBeInTheDocument();
    expect(sent).toEqual({ email: "mira@example.com", password: "correct-horse" });
    expect(
      within(screen.getByRole("banner")).getByRole("button", { name: /Mira Koval/ }),
    ).toBeInTheDocument();
  });

  it("shows the failed-login banner and keeps the email", async () => {
    server.use(http.post(loginUrl, () => problem(401)));
    renderRoute("/login");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Email"), "mira@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect.");
    expect(screen.getByLabelText("Email")).toHaveValue("mira@example.com");
  });

  it("shows the failed-login banner in Ukrainian", async () => {
    server.use(http.post(loginUrl, () => problem(401)));
    renderRoute("/login", { language: "uk" });
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Електронна пошта"), "mira@example.com");
    await user.type(screen.getByLabelText("Пароль"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Увійти" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Неправильна електронна пошта або пароль.",
    );
  });

  it("sends nothing and marks the email when it is empty", async () => {
    let requests = 0;
    server.use(
      http.post(loginUrl, () => {
        requests += 1;
        return HttpResponse.json(authResponse());
      }),
    );
    renderRoute("/login");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Password"), "correct-horse");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    const email = screen.getByLabelText("Email");
    await waitFor(() => expect(email).toHaveAttribute("aria-invalid", "true"));
    expect(email).toHaveAccessibleDescription("Enter your email.");
    expect(requests).toBe(0);
  });

  it("returns to the page the user came from", async () => {
    server.use(http.post(loginUrl, () => HttpResponse.json(authResponse())));
    renderRoute({ pathname: "/login", state: { from: "/no-such-page" } });
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Email"), "mira@example.com");
    await user.type(screen.getByLabelText("Password"), "correct-horse");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  });
});

describe("auth: Signed-in users skip the login and sign-up pages", () => {
  it("shows / instead of /login", async () => {
    startSignedIn();
    renderRoute("/login");

    expect(await screen.findByText("The dive-site map is coming soon.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Log in" })).not.toBeInTheDocument();
  });

  it("shows / instead of /register", async () => {
    startSignedIn();
    renderRoute("/register");

    expect(await screen.findByText("The dive-site map is coming soon.")).toBeInTheDocument();
  });
});
