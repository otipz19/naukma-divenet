import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY, startTheme } from "../../app/theme";
import { renderRoute } from "../../test/render";

/** A controllable stand-in for the dark colour-scheme media query; this OS prefers light. */
function lightSystem() {
  const target = new EventTarget();
  return Object.assign(target, {
    matches: false,
    media: "(prefers-color-scheme: dark)",
  }) as unknown as MediaQueryList;
}

const theme = () => document.documentElement.dataset.theme;
const headerGroup = (name = "Colour theme") =>
  within(within(screen.getByRole("banner")).getByRole("group", { name }));

let stop: (() => void) | undefined;
beforeEach(() => {
  localStorage.clear();
  stop = startTheme(lightSystem());
});
afterEach(() => {
  stop?.();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("shared/app-shell: The header has a theme switch", () => {
  it("System is the default", () => {
    renderRoute("/");

    const group = headerGroup();
    expect(group.getByRole("button", { name: "System theme" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(group.getByRole("button", { name: "Light theme" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(group.getByRole("button", { name: "Dark theme" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("Pick dark: pins the dark theme, and it holds after a reload", async () => {
    const { unmount } = renderRoute("/");

    await userEvent.click(headerGroup().getByRole("button", { name: "Dark theme" }));

    expect(theme()).toBe("dark");
    expect(headerGroup().getByRole("button", { name: "Dark theme" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    // A reload: the page starts again from the same storage.
    unmount();
    stop?.();
    delete document.documentElement.dataset.theme;
    stop = startTheme(lightSystem());
    renderRoute("/");

    expect(theme()).toBe("dark");
    expect(headerGroup().getByRole("button", { name: "Dark theme" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("Back to system: follows the light system again", async () => {
    renderRoute("/");
    await userEvent.click(headerGroup().getByRole("button", { name: "Dark theme" }));

    await userEvent.click(headerGroup().getByRole("button", { name: "System theme" }));

    expect(theme()).toBe("light");
    expect(headerGroup().getByRole("button", { name: "System theme" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("Theme switch in Ukrainian", () => {
    renderRoute("/", { language: "uk" });

    const group = headerGroup("Колірна тема");
    expect(group.getByRole("button", { name: "Системна тема" })).toBeInTheDocument();
    expect(group.getByRole("button", { name: "Світла тема" })).toBeInTheDocument();
    expect(group.getByRole("button", { name: "Темна тема" })).toBeInTheDocument();
  });

  it("Theme from the drawer: applies at once and keeps the drawer open", async () => {
    renderRoute("/");
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const drawer = within(screen.getByRole("dialog", { name: "Menu" }));

    await userEvent.click(
      within(drawer.getByRole("group", { name: "Colour theme" })).getByRole("button", {
        name: "Dark theme",
      }),
    );

    expect(theme()).toBe("dark");
    expect(screen.getByRole("dialog", { name: "Menu" })).toBeInTheDocument();
  });
});
