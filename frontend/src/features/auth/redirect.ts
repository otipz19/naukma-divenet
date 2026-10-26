import type { Location } from "react-router";

/** Router state set by links to the login page, so a login returns the user where they were. */
export interface FromState {
  from?: string;
}

const AUTH_PAGES = ["/login", "/register"];

/** Where to go after signing in: the page the user came from, or `/`. Never an auth page. */
export function redirectTarget(location: Location): string {
  const from = (location.state as FromState | null)?.from;
  if (!from || !from.startsWith("/") || from.startsWith("//")) return "/";
  return AUTH_PAGES.some((page) => from === page || from.startsWith(`${page}?`)) ? "/" : from;
}
