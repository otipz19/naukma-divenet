import { afterEach, describe, expect, it, vi } from "vitest";
import { LANGUAGE_STORAGE_KEY, detectInitialLanguage, saveLanguage } from "./language";

describe("shared/i18n: The initial language follows the saved choice or the browser", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses the saved choice over the browser language", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "uk");

    expect(detectInitialLanguage(["en-US"])).toBe("uk");
  });

  it("uses uk for a Ukrainian browser", () => {
    expect(detectInitialLanguage(["uk-UA", "en"])).toBe("uk");
  });

  it("uses en for any other browser language", () => {
    expect(detectInitialLanguage(["de-DE"])).toBe("en");
  });

  it("ignores an unsupported saved choice", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "fr");

    expect(detectInitialLanguage(["en-US"])).toBe("en");
  });

  it("uses en when the browser reports no language", () => {
    expect(detectInitialLanguage([])).toBe("en");
  });

  it("still starts when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(detectInitialLanguage(["uk"])).toBe("uk");
    expect(() => saveLanguage("en")).not.toThrow();
  });
});
