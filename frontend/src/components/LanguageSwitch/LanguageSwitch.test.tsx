import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LANGUAGE_STORAGE_KEY } from "../../i18n/language";
import { renderRoute } from "../../test/render";

const headerSwitch = () =>
  within(within(screen.getByRole("banner")).getByRole("group", { name: /Language|Мова/ }));

describe("shared/app-shell: The header has a language switch", () => {
  it("presses the button of the active locale", () => {
    renderRoute("/");

    expect(headerSwitch().getByRole("button", { name: "EN" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(headerSwitch().getByRole("button", { name: "UK" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("switches the page to Ukrainian, saves the choice and sets <html lang>", async () => {
    renderRoute("/");

    await userEvent.click(headerSwitch().getByRole("button", { name: "UK" }));

    const header = screen.getByRole("banner");
    expect(within(header).getByRole("navigation", { name: "Основна" })).toBeInTheDocument();
    expect(within(header).getByRole("link", { name: "Мапа" })).toBeInTheDocument();
    expect(within(screen.getByRole("contentinfo")).getByText("Безпека:")).toBeInTheDocument();
    expect(headerSwitch().getByRole("button", { name: "UK" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(headerSwitch().getByRole("button", { name: "EN" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("uk");
    expect(document.documentElement).toHaveAttribute("lang", "uk");
  });
});
