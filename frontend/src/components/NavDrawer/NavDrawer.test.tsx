import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderRoute } from "../../test/render";

const menuButton = () => screen.getByRole("button", { name: "Open menu" });

describe("shared/app-shell: Narrow screens use a navigation drawer", () => {
  it("opens a dialog with the navigation and the language switch", async () => {
    renderRoute("/");
    expect(menuButton()).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(menuButton());

    expect(menuButton()).toHaveAttribute("aria-expanded", "true");
    const dialog = screen.getByRole("dialog", { name: "Menu" });
    const nav = within(dialog).getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "Map" })).toHaveAttribute("href", "/");
    expect(within(dialog).getByRole("group", { name: "Language" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Close menu" })).toHaveFocus();
  });

  it("names the dialog in the active locale", async () => {
    renderRoute("/", { language: "uk" });

    await userEvent.click(screen.getByRole("button", { name: "Відкрити меню" }));

    expect(screen.getByRole("dialog", { name: "Меню" })).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the menu button", async () => {
    renderRoute("/");
    await userEvent.click(menuButton());

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(menuButton()).toHaveAttribute("aria-expanded", "false");
    expect(menuButton()).toHaveFocus();
  });

  it("closes on its close button", async () => {
    renderRoute("/");
    await userEvent.click(menuButton());

    await userEvent.click(screen.getByRole("button", { name: "Close menu" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(menuButton()).toHaveFocus();
  });

  it("closes when the Map entry in it is followed and shows /", async () => {
    renderRoute("/no-such-page");
    await userEvent.click(menuButton());

    await userEvent.click(within(screen.getByRole("dialog")).getByRole("link", { name: "Map" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "DiveNet" })).toBeInTheDocument();
  });

  it("keeps Tab focus inside the dialog", async () => {
    renderRoute("/");
    await userEvent.click(menuButton());
    const dialog = screen.getByRole("dialog");
    // The account links (add-authentication) come last, after the language switch.
    const lastControl = await within(dialog).findByRole("link", { name: "Sign up" });

    await userEvent.tab({ shift: true });

    expect(lastControl).toHaveFocus();
    await userEvent.tab();
    expect(within(dialog).getByRole("button", { name: "Close menu" })).toHaveFocus();
  });
});
