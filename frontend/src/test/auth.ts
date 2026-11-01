import { HttpResponse, http } from "msw";
import type { SessionUser } from "../api/session";
import { refreshUrl, server } from "./server";

export const MIRA = {
  id: 7,
  email: "mira@example.com",
  displayName: "Mira Koval",
  role: "USER" as const,
};

/** An `AuthResponse` body for Mira. */
export function authResponse(accessToken = "token-1", user: SessionUser = MIRA) {
  return { accessToken, tokenType: "Bearer" as const, expiresIn: 900, user };
}

/** Makes the page-load refresh succeed, so the app starts signed in, as Mira unless told otherwise. */
export function startSignedIn(user: SessionUser = MIRA) {
  server.use(http.post(refreshUrl(), () => HttpResponse.json(authResponse("token-1", user))));
}
