export const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

/**
 * Sets `<html data-theme>` from the system colour-scheme preference and follows its changes.
 * There is no manual toggle (docs/DESIGN.md). Returns a function that stops following.
 */
export function watchSystemTheme(media: MediaQueryList = window.matchMedia(DARK_SCHEME_QUERY)) {
  const apply = () => {
    document.documentElement.dataset.theme = media.matches ? "dark" : "light";
  };
  apply();
  media.addEventListener("change", apply);
  return () => media.removeEventListener("change", apply);
}
