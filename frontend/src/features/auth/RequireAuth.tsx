import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { NotFoundPage } from "../../app/routes/NotFoundPage";
import type { FromState } from "./redirect";
import { useSession } from "./useSession";

/**
 * Renders its page for a signed-in user. A signed-out visitor goes to the login page, which returns
 * here; with `admin`, anyone else sees the not-found page, so the page's existence stays unadvertised.
 */
export function RequireAuth({ admin = false, children }: { admin?: boolean; children: ReactNode }) {
  const session = useSession();
  const location = useLocation();
  if (session.status === "loading") return null;
  if (session.status === "signedOut") {
    const state: FromState = { from: `${location.pathname}${location.search}` };
    return <Navigate to="/login" state={state} replace />;
  }
  if (admin && session.user.role !== "ADMIN") return <NotFoundPage />;
  return children;
}
