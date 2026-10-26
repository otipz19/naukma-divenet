import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderRoute } from "../test/render";

describe("shared/web-app: The app serves a placeholder home page", () => {
  it("renders the product name and the placeholder notice inside the main landmark at /", () => {
    renderRoute("/");

    const main = screen.getByRole("main");
    expect(within(main).getByRole("heading", { level: 1, name: "DiveNet" })).toBeInTheDocument();
    expect(within(main).getByText("The dive-site map is coming soon.")).toBeInTheDocument();
  });
});

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

    expect(screen.getByRole("heading", { level: 1, name: "DiveNet" })).toBeInTheDocument();
  });
});

describe("shared/app-shell: Every page renders inside the app shell", () => {
  it("gives the home page one banner, main and contentinfo landmark", () => {
    renderRoute("/");

    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
    expect(
      within(screen.getByRole("main")).getByRole("heading", { name: "DiveNet" }),
    ).toBeVisible();
  });

  it("gives the not-found page the landmarks, with the message inside main", () => {
    renderRoute("/no-such-page");

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
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
