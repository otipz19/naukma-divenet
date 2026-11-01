import type { RouteObject } from "react-router";
import { RequireAuth } from "../auth/RequireAuth";
import { DiveLogPage } from "./DiveLogPage";

/** The dive log page; src/app/router.tsx adds it to the layout route. */
export const diveLogRoutes: RouteObject[] = [
  {
    path: "dive-log",
    element: (
      <RequireAuth>
        <DiveLogPage />
      </RequireAuth>
    ),
  },
];
