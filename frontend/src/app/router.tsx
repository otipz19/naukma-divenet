import { createBrowserRouter, type RouteObject } from "react-router";
import { authRoutes } from "../features/auth/routes";
import { diveLogRoutes } from "../features/divelog/routes";
import { postRoutes } from "../features/post/routes";
import { reviewRoutes } from "../features/review/routes";
import { siteRoutes } from "../features/site/routes";
import { userRoutes } from "../features/user/routes";
import { warningRoutes } from "../features/warning/routes";
import { AppLayout } from "./AppLayout";
import { NotFoundPage } from "./routes/NotFoundPage";

// Every page renders inside the app shell. Feature changes add their routes to `children`
// from src/features/<feature>/, and their navigation entries to ./navigation.ts.
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      ...siteRoutes,
      ...reviewRoutes,
      ...warningRoutes,
      ...userRoutes,
      ...postRoutes,
      ...diveLogRoutes,
      ...authRoutes,
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
