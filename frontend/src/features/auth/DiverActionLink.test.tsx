import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { authResponse, startSignedIn } from "../../test/auth";
import { renderRoute } from "../../test/render";
import { server } from "../../test/server";

const origin = window.location.origin;

const blueHole = {
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
  status: "APPROVED" as const,
};

const notFound = () =>
  HttpResponse.json(
    { status: 404 },
    { status: 404, headers: { "Content-Type": "application/problem+json" } },
  );

function serveSite() {
  server.use(
    http.get(`${origin}/api/v1/sites/7`, () => HttpResponse.json(blueHole)),
    http.get(`${origin}/api/v1/sites/7/reviews/mine`, () => notFound()),
    http.post(`${origin}/api/v1/auth/login`, () => HttpResponse.json(authResponse())),
    http.get(`${origin}/api/v1/countries`, () =>
      HttpResponse.json([
        { code: "EG", name: "Egypt", regions: [{ code: "eg-dahab", name: "Dahab" }] },
      ]),
    ),
    http.get(`${origin}/api/v1/gear-items`, () => HttpResponse.json([])),
  );
}

const dialog = () => screen.findByRole("dialog", { name: "Log in to continue" });

async function logIn(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText("Email"), "mira@example.com");
  await user.type(screen.getByLabelText("Password"), "correct-horse");
  await user.click(screen.getByRole("button", { name: "Log in" }));
}

describe("auth: Diver actions ask a visitor to log in", () => {
  it("Visitor presses an action: a dialog opens and the page stays", async () => {
    serveSite();
    renderRoute("/sites/7");
    const link = await screen.findByRole("link", { name: "Write a review" });
    expect(link).toHaveAttribute("href", "/sites/7/review");

    await userEvent.click(link);

    const prompt = within(await dialog());
    expect(prompt.getByText("Log in to write a review.")).toBeInTheDocument();
    expect(prompt.getByRole("button", { name: "Log in" })).toBeInTheDocument();
    expect(prompt.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Blue Hole" })).toBeInTheDocument();
  });

  it("Each action names itself, in the active language", async () => {
    serveSite();
    renderRoute("/sites/7");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("link", { name: "Log a dive here" }));
    expect(
      within(await dialog()).getByText("Log in to log a dive at this site."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await user.click(await screen.findByRole("link", { name: "Report a warning" }));
    expect(within(await dialog()).getByText("Log in to report a warning.")).toBeInTheDocument();
  });

  it("names Add a site in Ukrainian", async () => {
    renderRoute("/", { language: "uk" });

    await userEvent.click(await screen.findByRole("link", { name: "Додати місце" }));

    const prompt = within(await screen.findByRole("dialog", { name: "Увійдіть, щоб продовжити" }));
    expect(prompt.getByText("Увійдіть, щоб додати місце для дайвінгу.")).toBeInTheDocument();
    expect(prompt.getByRole("button", { name: "Увійти" })).toBeInTheDocument();
  });

  it("Cancel closes the dialog and returns focus to the action", async () => {
    serveSite();
    renderRoute("/sites/7");
    const user = userEvent.setup();
    const link = await screen.findByRole("link", { name: "Write a review" });
    link.focus();

    await user.click(link);
    await dialog();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(link).toHaveFocus();
    expect(screen.getByRole("heading", { level: 1, name: "Blue Hole" })).toBeInTheDocument();
  });

  it("Signed-in diver: no dialog, the review form opens", async () => {
    serveSite();
    startSignedIn();
    renderRoute("/sites/7");

    await userEvent.click(await screen.findByRole("link", { name: "Write a review" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Write a review" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Log in to continue" })).not.toBeInTheDocument();
  });
});

describe("auth: Logging in from the dialog returns to the action", () => {
  it("Log in and continue: the review form is shown after logging in", async () => {
    serveSite();
    renderRoute("/sites/7");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("link", { name: "Write a review" }));
    await user.click(within(await dialog()).getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("heading", { name: "Log in" })).toBeInTheDocument();
    await logIn(user);

    expect(
      await screen.findByRole("heading", { level: 1, name: "Write a review" }),
    ).toBeInTheDocument();
  });

  it("Add a site after login: the submission page is shown", async () => {
    serveSite();
    renderRoute("/");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("link", { name: "Add a site" }));
    await user.click(within(await dialog()).getByRole("button", { name: "Log in" }));
    await logIn(user);

    expect(await screen.findByRole("heading", { name: "Submit a dive site" })).toBeInTheDocument();
  });

  it("Direct URL keeps the redirect to the login page", async () => {
    serveSite();
    renderRoute("/sites/7/review");
    const user = userEvent.setup();

    expect(await screen.findByRole("heading", { name: "Log in" })).toBeInTheDocument();
    await logIn(user);

    expect(
      await screen.findByRole("heading", { level: 1, name: "Write a review" }),
    ).toBeInTheDocument();
  });
});
