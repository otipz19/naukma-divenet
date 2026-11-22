import { afterEach, describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY, setThemeChoice, startTheme } from "./theme";

/** A controllable stand-in for `matchMedia("(prefers-color-scheme: dark)")`. */
function fakeMedia(matches: boolean) {
  const target = new EventTarget();
  const media = Object.assign(target, { matches, media: "(prefers-color-scheme: dark)" });
  return {
    media: media as unknown as MediaQueryList,
    change(next: boolean) {
      media.matches = next;
      target.dispatchEvent(new Event("change"));
    },
  };
}

const theme = () => document.documentElement.dataset.theme;

let stop: (() => void) | undefined;
afterEach(() => {
  stop?.();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("shared/app-shell: The colour theme follows the system preference", () => {
  it("Light system: uses the light theme with no saved choice", () => {
    stop = startTheme(fakeMedia(false).media);

    expect(theme()).toBe("light");
  });

  it("Dark system: uses the dark theme with no saved choice", () => {
    stop = startTheme(fakeMedia(true).media);

    expect(theme()).toBe("dark");
  });

  it("Preference changes while open: follows it with the choice system", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "system");
    const system = fakeMedia(false);
    stop = startTheme(system.media);

    system.change(true);

    expect(theme()).toBe("dark");
  });

  it("Saved choice wins over the system, and ignores its changes", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    const system = fakeMedia(true);
    stop = startTheme(system.media);

    expect(theme()).toBe("light");
    system.change(false);
    system.change(true);
    expect(theme()).toBe("light");
  });

  it("Unknown saved value: follows the system", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "sepia");
    stop = startTheme(fakeMedia(true).media);

    expect(theme()).toBe("dark");
  });

  it("goes back to following the system when System is chosen again", () => {
    const system = fakeMedia(false);
    stop = startTheme(system.media);

    setThemeChoice("dark");
    expect(theme()).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    system.change(false);
    expect(theme()).toBe("dark");

    setThemeChoice("system");
    expect(theme()).toBe("light");
    system.change(true);
    expect(theme()).toBe("dark");
  });
});
