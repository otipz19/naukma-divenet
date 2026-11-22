import { useSyncExternalStore } from "react";
import { getSession, subscribeSession, type Session } from "../../api/session";

/** The current session; components re-render when it changes. */
export function useSession(): Session {
  return useSyncExternalStore(subscribeSession, getSession);
}

/** True only for a signed-in admin; false while the session loads or when signed out. */
export function useIsAdmin(): boolean {
  const session = useSession();
  return session.status === "signedIn" && session.user.role === "ADMIN";
}
