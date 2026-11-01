import type { RouteObject } from "react-router";
import { RequireAuth } from "../auth/RequireAuth";
import { WarningFormPage } from "./WarningFormPage";

/** The warning create and edit routes; src/app/router.tsx adds them to the layout route. */
export const warningRoutes: RouteObject[] = [
  {
    path: "sites/:id/warnings/new",
    element: (
      <RequireAuth>
        <WarningFormPage />
      </RequireAuth>
    ),
  },
  {
    path: "sites/:id/warnings/:warningId/edit",
    element: (
      <RequireAuth>
        <WarningFormPage />
      </RequireAuth>
    ),
  },
];
