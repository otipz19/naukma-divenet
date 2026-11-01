import type { RouteObject } from "react-router";
import { RequireAuth } from "../auth/RequireAuth";
import { MapPage } from "./MapPage";
import { ModerationPage } from "./ModerationPage";
import { SitePage } from "./SitePage";
import { SubmitSitePage } from "./SubmitSitePage";

/** The map and site pages; src/app/router.tsx adds them to the layout route. */
export const siteRoutes: RouteObject[] = [
  { index: true, element: <MapPage /> },
  {
    path: "sites/new",
    element: (
      <RequireAuth>
        <SubmitSitePage />
      </RequireAuth>
    ),
  },
  { path: "sites/:id", element: <SitePage /> },
  {
    path: "admin/moderation",
    element: (
      <RequireAuth admin>
        <ModerationPage />
      </RequireAuth>
    ),
  },
];
