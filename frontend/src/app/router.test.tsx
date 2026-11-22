import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { ADMIN, startSignedIn } from "../test/auth";
import { renderRoute } from "../test/render";
import { server } from "../test/server";

const header = () => within(screen.getByRole("banner"));
const nav = () => within(header().getByRole("navigation", { name: "Main" }));

describe("shared/web-app: Unknown paths show a not-found page", () => {
  it("shows the not-found message and a link home", () => {
    renderRoute("/no-such-page");

    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the home page" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("returns to the home page through the link", async () => {
    renderRoute("/no-such-page");

    await userEvent.click(screen.getByRole("link", { name: "Back to the home page" }));

    expect(screen.getByRole("heading", { level: 1, name: "Dive-site map" })).toBeInTheDocument();
  });
});

describe("shared/app-shell: Every page renders inside the app shell", () => {
  it("gives the home page one banner and one main landmark, and no footer", () => {
    renderRoute("/");

    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("main")).getByRole("heading", { name: "Dive-site map" }),
    ).toBeVisible();
  });

  it("gives the not-found page the landmarks, with the message inside main", () => {
    renderRoute("/no-such-page");

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(
      within(screen.getByRole("main")).getByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
  });
});

describe("shared/app-shell: A skip link leads past the header", () => {
  it("is focused by the first Tab and moves focus to the main landmark", async () => {
    renderRoute("/");

    await userEvent.tab();
    const skipLink = screen.getByRole("link", { name: "Skip to content" });
    expect(skipLink).toHaveFocus();

    await userEvent.keyboard("{Enter}");

    expect(screen.getByRole("main")).toHaveFocus();
  });

  it("uses the active locale", async () => {
    renderRoute("/", { language: "uk" });

    await userEvent.tab();

    expect(screen.getByRole("link", { name: "Перейти до вмісту" })).toHaveFocus();
  });
});

describe("auth: Diver pages send the admin to moderation (routes)", () => {
  it("Admin opens the dive log: the moderation page is shown and the dive log is not requested", async () => {
    const diveLogRequests: string[] = [];
    server.use(
      http.get("*/api/v1/users/:id/dive-log", ({ request }) => {
        diveLogRequests.push(request.url);
        return HttpResponse.json({ content: [], page: {} });
      }),
    );
    startSignedIn(ADMIN);
    renderRoute("/dive-log");

    expect(await screen.findByRole("heading", { name: "Moderation" })).toBeInTheDocument();
    expect(nav().getByRole("link", { name: "Moderation" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("heading", { name: "Dive log" })).not.toBeInTheDocument();
    expect(diveLogRequests).toHaveLength(0);
  });

  it("Admin opens the post editor: the moderation page is shown", async () => {
    startSignedIn(ADMIN);
    renderRoute("/posts/new");

    expect(await screen.findByRole("heading", { name: "Moderation" })).toBeInTheDocument();
    expect(nav().getByRole("link", { name: "Moderation" })).toHaveAttribute("aria-current", "page");
  });

  it("Diver opens the dive log: the dive log page is shown", async () => {
    startSignedIn();
    renderRoute("/dive-log");

    expect(await screen.findByRole("heading", { level: 1, name: "Dive log" })).toBeInTheDocument();
  });
});

describe("shared/app-shell: Navigation entries can be limited by role", () => {
  const labels = () =>
    nav()
      .getAllByRole("link")
      .map((link) => link.textContent);

  it("Admin navigation: Map, Feed and Moderation, with no Dive log", async () => {
    startSignedIn(ADMIN);
    renderRoute("/");

    await nav().findByRole("link", { name: "Moderation" });
    expect(labels()).toEqual(["Map", "Feed", "Moderation"]);
  });

  it("Diver navigation: Map, Feed and Dive log, with no Moderation", async () => {
    startSignedIn();
    renderRoute("/");

    await header().findByRole("button", { name: /Mira Koval/ });
    expect(labels()).toEqual(["Map", "Feed", "Dive log"]);
  });

  it("No entry for the admin: no Dive log link", async () => {
    startSignedIn(ADMIN);
    renderRoute("/feed");

    await nav().findByRole("link", { name: "Moderation" });
    expect(nav().queryByRole("link", { name: "Dive log" })).not.toBeInTheDocument();
  });
});

function Boom(): never {
  throw new Error("boom");
}
const crashing = [{ path: "crash", element: <Boom /> }];

describe("shared/web-app: A page that crashes shows an error page", () => {
  it("shows the error page inside the shell, without the error text", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderRoute("/crash", { extraRoutes: crashing });

    expect(screen.getByRole("banner")).toBeInTheDocument();
    const main = within(screen.getByRole("main"));
    expect(await main.findByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    expect(main.getByRole("button", { name: "Reload page" })).toBeInTheDocument();
    expect(main.getByRole("link", { name: "Go to the map" })).toHaveAttribute("href", "/");
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
  });

  it("leaves the error page through the header navigation", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderRoute("/crash", { extraRoutes: crashing });
    await screen.findByRole("heading", { name: "Something went wrong" });

    await userEvent.click(nav().getByRole("link", { name: "Feed" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Feed" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Something went wrong" })).not.toBeInTheDocument();
  });

  it("uses the active locale", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderRoute("/crash", { extraRoutes: crashing, language: "uk" });

    expect(await screen.findByRole("heading", { name: "Щось пішло не так" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Перезавантажити сторінку" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Перейти до мапи" })).toHaveAttribute("href", "/");
  });
});
