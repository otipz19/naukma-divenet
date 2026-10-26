import { useSyncExternalStore } from "react";
import { getSession, subscribeSession, type Session } from "../../api/session";

/** The current session; components re-render when it changes. */
export function useSession(): Session {
  return useSyncExternalStore(subscribeSession, getSession);
}
