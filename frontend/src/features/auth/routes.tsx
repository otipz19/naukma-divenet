import type { RouteObject } from "react-router";
import { LoginPage } from "./LoginPage";
import { RegisterPage } from "./RegisterPage";

/** The auth pages; src/app/router.tsx adds them to the layout route. */
export const authRoutes: RouteObject[] = [
  { path: "login", element: <LoginPage /> },
  { path: "register", element: <RegisterPage /> },
];
