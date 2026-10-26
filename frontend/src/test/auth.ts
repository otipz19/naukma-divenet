import { HttpResponse, http } from "msw";
import { refreshUrl, server } from "./server";

export const MIRA = {
  id: 7,
  email: "mira@example.com",
  displayName: "Mira Koval",
  role: "USER" as const,
};

/** An `AuthResponse` body for Mira. */
export function authResponse(accessToken = "token-1") {
  return { accessToken, tokenType: "Bearer" as const, expiresIn: 900, user: MIRA };
}

/** Makes the page-load refresh succeed, so the app starts signed in as Mira. */
export function startSignedIn() {
  server.use(http.post(refreshUrl(), () => HttpResponse.json(authResponse())));
}
