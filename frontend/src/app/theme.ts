import { useSyncExternalStore } from "react";

export const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";
export const THEME_STORAGE_KEY = "divenet.theme";

/** The visitor's choice in the theme switch; `system` follows the OS preference. */
export type ThemeChoice = "system" | "light" | "dark";
export const THEME_CHOICES: readonly ThemeChoice[] = ["system", "light", "dark"];

function readChoice(): ThemeChoice {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return THEME_CHOICES.includes(saved as ThemeChoice) ? (saved as ThemeChoice) : "system";
  } catch {
    // Storage can be blocked; the system theme still works.
    return "system";
  }
}

let media: MediaQueryList | undefined;
let choice: ThemeChoice = "system";
const listeners = new Set<() => void>();

const applySystem = () => {
  document.documentElement.dataset.theme = media?.matches ? "dark" : "light";
};

function apply() {
  media?.removeEventListener("change", applySystem);
  if (choice === "system") {
    applySystem();
    media?.addEventListener("change", applySystem);
  } else {
    document.documentElement.dataset.theme = choice;
  }
}

/**
 * Sets `<html data-theme>` from the saved choice before the first render (spec shared/app-shell):
 * a pinned light or dark theme, or the system preference, followed live while `system` is chosen.
 * Returns a function that stops following the system.
 */
export function startTheme(query: MediaQueryList = window.matchMedia(DARK_SCHEME_QUERY)) {
  media = query;
  choice = readChoice();
  apply();
  return () => {
    query.removeEventListener("change", applySystem);
    if (media === query) media = undefined;
  };
}

/** Applies and saves a choice from the theme switch, and tells every switch about it. */
export function setThemeChoice(next: ThemeChoice) {
  choice = next;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // The choice still holds until the page is reloaded.
  }
  apply();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The current theme choice, kept in sync across the header and the drawer. */
export function useThemeChoice(): ThemeChoice {
  return useSyncExternalStore(subscribe, () => choice);
}
