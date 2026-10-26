import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderRoute } from "../../test/render";

const header = () => within(screen.getByRole("banner"));

describe("shared/app-shell: The header shows the wordmark and the main navigation", () => {
  it("links the wordmark to / and lists Map in the labelled navigation", () => {
    renderRoute("/");

    expect(header().getByRole("link", { name: "DiveNet" })).toHaveAttribute("href", "/");
    const nav = header().getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "Map" })).toHaveAttribute("href", "/");
  });

  it("shows the navigation in Ukrainian", () => {
    renderRoute("/", { language: "uk" });

    const nav = header().getByRole("navigation", { name: "Основна" });
    expect(within(nav).getByRole("link", { name: "Мапа" })).toHaveAttribute("href", "/");
  });
});

describe("shared/app-shell: The current page is marked in the navigation", () => {
  it("marks Map as current on the home page", () => {
    renderRoute("/");

    const nav = header().getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "Map" })).toHaveAttribute("aria-current", "page");
  });

  it("marks no entry on an unknown path", () => {
    renderRoute("/no-such-page");

    const nav = header().getByRole("navigation", { name: "Main" });
    for (const link of within(nav).getAllByRole("link")) {
      expect(link).not.toHaveAttribute("aria-current");
    }
  });
});
