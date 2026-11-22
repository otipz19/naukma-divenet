import { createBrowserRouter, type RouteObject } from "react-router";
import { authRoutes } from "../features/auth/routes";
import { diveLogRoutes } from "../features/divelog/routes";
import { postRoutes } from "../features/post/routes";
import { reviewRoutes } from "../features/review/routes";
import { siteRoutes } from "../features/site/routes";
import { userRoutes } from "../features/user/routes";
import { warningRoutes } from "../features/warning/routes";
import { AppLayout } from "./AppLayout";
import { ErrorPage } from "./routes/ErrorPage";
import { NotFoundPage } from "./routes/NotFoundPage";

// Feature changes add their routes here from src/features/<feature>/, and their navigation
// entries to ./navigation.ts.
const pages: RouteObject[] = [
  ...siteRoutes,
  ...reviewRoutes,
  ...warningRoutes,
  ...userRoutes,
  ...postRoutes,
  ...diveLogRoutes,
  ...authRoutes,
  { path: "*", element: <NotFoundPage /> },
];

/**
 * Every page renders inside the app shell. The pathless route between them catches a page that
 * throws while rendering and shows the error page in the outlet, so the header stays; the router
 * clears the error on the next navigation. Tests pass `extra` pages to reach that route.
 */
export function buildRoutes(extra: RouteObject[] = []): RouteObject[] {
  return [
    {
      element: <AppLayout />,
      children: [{ errorElement: <ErrorPage />, children: [...extra, ...pages] }],
    },
  ];
}

export const routes = buildRoutes();

export function createAppRouter() {
  return createBrowserRouter(routes);
}
