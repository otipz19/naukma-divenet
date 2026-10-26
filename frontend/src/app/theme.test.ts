import { afterEach, describe, expect, it } from "vitest";
import { watchSystemTheme } from "./theme";

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

let stop: (() => void) | undefined;
afterEach(() => {
  stop?.();
  delete document.documentElement.dataset.theme;
});

describe("shared/app-shell: The colour theme follows the system preference", () => {
  it("uses the light theme when the system does not prefer dark", () => {
    stop = watchSystemTheme(fakeMedia(false).media);

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("uses the dark theme when the system prefers dark", () => {
    stop = watchSystemTheme(fakeMedia(true).media);

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("follows a preference change while the app is open", () => {
    const system = fakeMedia(false);
    stop = watchSystemTheme(system.media);

    system.change(true);

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });
});
