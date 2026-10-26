import { apiBaseUrl } from "./baseUrl";
import type { components } from "./schema.gen";

export type SessionUser = components["schemas"]["UserResponse"];
export type AuthResponse = components["schemas"]["AuthResponse"];

/** `loading` until the first refresh on page load has answered (spec auth). */
export type Session =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; user: SessionUser; accessToken: string };

// The access token lives only here, in memory: never in storage or a readable cookie (ADR-0004).
let session: Session = { status: "loading" };
const listeners = new Set<() => void>();
let refreshing: Promise<boolean> | undefined;

function set(next: Session) {
  session = next;
  for (const listener of listeners) listener();
}

export function getSession(): Session {
  return session;
}

/** For `useSyncExternalStore`. */
export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function accessToken(): string | undefined {
  return session.status === "signedIn" ? session.accessToken : undefined;
}

export function signIn(auth: AuthResponse) {
  set({ status: "signedIn", user: auth.user, accessToken: auth.accessToken });
}

export function signOut() {
  set({ status: "signedOut" });
}

/**
 * Trades the refresh cookie for a new access token. Concurrent callers share one request, because
 * the server treats a second use of a rotated token as a replay and ends the session.
 */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const response = await fetch(`${apiBaseUrl()}/auth/refresh`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) {
        signOut();
        return false;
      }
      signIn((await response.json()) as AuthResponse);
      return true;
    } catch {
      signOut();
      return false;
    } finally {
      refreshing = undefined;
    }
  })();
  return refreshing;
}

/** Restores the session from the refresh cookie once per page load; later calls do nothing. */
export function restoreSession(): Promise<void> {
  if (session.status !== "loading") return Promise.resolve();
  return refreshSession().then(() => undefined);
}

/** Tests only: back to the state of a fresh page load. */
export function resetSession() {
  refreshing = undefined;
  session = { status: "loading" };
  listeners.clear();
}
