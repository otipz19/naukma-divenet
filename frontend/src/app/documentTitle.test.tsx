import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";
import { createI18n } from "../i18n";
import { ADMIN, startSignedIn } from "../test/auth";
import { renderRoute } from "../test/render";
import { server } from "../test/server";
import { useDocumentTitle } from "./documentTitle";

function Titled({ page }: { page?: string }) {
  useDocumentTitle(page);
  return null;
}

const problem = (status: number) =>
  HttpResponse.json(
    { status },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );

describe("shared/web-app: Every page has its own document title", () => {
  it("formats the title, and uses the bare name without a page", () => {
    const { rerender } = render(
      <I18nextProvider i18n={createI18n("en")}>
        <Titled page="Feed" />
      </I18nextProvider>,
    );
    expect(document.title).toBe("Feed · DiveNet");

    rerender(
      <I18nextProvider i18n={createI18n("en")}>
        <Titled />
      </I18nextProvider>,
    );
    expect(document.title).toBe("DiveNet");
  });

  it("Static page title", async () => {
    server.use(
      http.get("*/api/v1/countries", () => HttpResponse.json([])),
      http.get("*/api/v1/posts", () =>
        HttpResponse.json({
          content: [],
          page: { number: 0, size: 20, totalElements: 0, totalPages: 0 },
        }),
      ),
    );
    renderRoute("/feed");

    await waitFor(() => expect(document.title).toBe("Feed · DiveNet"));
  });

  it("Title from data", async () => {
    server.use(
      http.get("*/api/v1/sites/7", () =>
        HttpResponse.json({
          id: 7,
          name: "SS Thistlegorm",
          lat: 27.8,
          lng: 33.9,
          countryCode: "EG",
          regionCode: "eg-dahab",
          difficulty: 3,
          minDepth: 16,
          maxDepth: 32,
          description: "A wreck.",
          requiredGear: [],
          recommendedGear: [],
          ratingCount: 0,
          reviewCount: 0,
          status: "APPROVED",
        }),
      ),
      http.get("*/api/v1/sites/7/warnings", () => HttpResponse.json([])),
      http.get("*/api/v1/posts", () =>
        HttpResponse.json({
          content: [],
          page: { number: 0, size: 20, totalElements: 0, totalPages: 0 },
        }),
      ),
    );
    renderRoute("/sites/7");

    await screen.findByRole("heading", { level: 1, name: "SS Thistlegorm" });
    expect(document.title).toBe("SS Thistlegorm · DiveNet");
  });

  it("Title follows the language", async () => {
    server.use(http.all("*/api/v1/*", () => problem(404)));
    startSignedIn();
    renderRoute("/dive-log");
    await waitFor(() => expect(document.title).toBe("Dive log · DiveNet"));

    await userEvent.click(await screen.findByRole("button", { name: "UK" }));

    const uk = createI18n("uk").t("divelog.title");
    await waitFor(() => expect(document.title).toBe(`${uk} · DiveNet`));
  });

  it("Not-found title", async () => {
    renderRoute("/no-such-page");

    await waitFor(() => expect(document.title).toBe("Page not found · DiveNet"));
  });

  // Every route of the router, with a param value where it needs one; each answer from the API is
  // a 404, which every page handles, so only the title is under test.
  const ROUTES: { path: string; as?: "diver" | "admin" }[] = [
    { path: "/" },
    { path: "/sites/new", as: "diver" },
    { path: "/sites/7" },
    { path: "/admin/moderation", as: "admin" },
    { path: "/sites/7/review", as: "diver" },
    { path: "/sites/7/warnings/new", as: "diver" },
    { path: "/sites/7/warnings/3/edit", as: "diver" },
    { path: "/users/7" },
    { path: "/profile/certificates", as: "diver" },
    { path: "/profile/edit", as: "diver" },
    { path: "/feed" },
    { path: "/posts/new", as: "diver" },
    { path: "/posts/5" },
    { path: "/posts/5/edit", as: "diver" },
    { path: "/dive-log", as: "diver" },
    { path: "/login" },
    { path: "/register" },
    { path: "/no-such-page" },
  ];

  it.each(ROUTES)("Every route has a title: $path", async ({ path, as }) => {
    server.use(http.all("*/api/v1/*", () => problem(404)));
    if (as) startSignedIn(as === "admin" ? ADMIN : undefined);
    renderRoute(path);

    await waitFor(() => expect(document.title).toMatch(/^.+ · DiveNet$/));
    expect(document.title).not.toBe("DiveNet");
  });
});
