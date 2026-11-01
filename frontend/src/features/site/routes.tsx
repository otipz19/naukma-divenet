import type { RouteObject } from "react-router";
import { MapPage } from "./MapPage";
import { SitePage } from "./SitePage";

/** The map and site pages; src/app/router.tsx adds them to the layout route. */
export const siteRoutes: RouteObject[] = [
  { index: true, element: <MapPage /> },
  { path: "sites/:id", element: <SitePage /> },
];
