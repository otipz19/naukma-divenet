import { useSyncExternalStore } from "react";

/** The map page's phone layout starts below `bp-lg` (docs/DESIGN.md rule 9; rework-map-page design D3). */
export const NARROW_MAP_QUERY = "(max-width: 1099px)";

/** Whether the media query matches now, following its changes. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
  );
}
