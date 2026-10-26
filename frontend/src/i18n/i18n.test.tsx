import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderRoute } from "../test/render";
import { createI18n } from ".";
import { LANGUAGE_STORAGE_KEY } from "./language";

describe("shared/i18n: The UI supports English and Ukrainian", () => {
  it("shows the uk text when the active locale is uk", () => {
    renderRoute("/", { language: "uk" });

    expect(screen.getByText("Мапа місць для занурень незабаром з’явиться.")).toBeInTheDocument();
  });

  it("falls back to en for a key missing from uk", () => {
    const i18n = createI18n("uk", {
      en: { translation: { onlyInEnglish: "English text" } },
      uk: { translation: {} },
    });

    expect(i18n.t("onlyInEnglish")).toBe("English text");
  });

  it("falls back to en for an empty uk value", () => {
    const i18n = createI18n("uk", {
      en: { translation: { greeting: "Hello" } },
      uk: { translation: { greeting: "" } },
    });

    expect(i18n.t("greeting")).toBe("Hello");
  });
});

describe("shared/i18n: A language change is saved and reflected in the document", () => {
  it("saves the new choice and updates <html lang>", async () => {
    const i18n = createI18n("en");

    await i18n.changeLanguage("uk");

    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("uk");
    expect(document.documentElement).toHaveAttribute("lang", "uk");
  });

  it("sets <html lang> on start", () => {
    document.documentElement.lang = "xx";

    createI18n("en");

    expect(document.documentElement).toHaveAttribute("lang", "en");
  });
});
