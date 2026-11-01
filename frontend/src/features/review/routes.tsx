import type { RouteObject } from "react-router";
import { RequireAuth } from "../auth/RequireAuth";
import { ReviewFormPage } from "./ReviewFormPage";

/** The review form; src/app/router.tsx adds it to the layout route. */
export const reviewRoutes: RouteObject[] = [
  {
    path: "sites/:id/review",
    element: (
      <RequireAuth>
        <ReviewFormPage />
      </RequireAuth>
    ),
  },
];
