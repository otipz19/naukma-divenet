import type { RouteObject } from "react-router";
import { RequireAuth } from "../auth/RequireAuth";
import { ProfileEditPage } from "./ProfileEditPage";
import { ProfilePage } from "./ProfilePage";

/** The profile pages; src/app/router.tsx adds them to the layout route. */
export const userRoutes: RouteObject[] = [
  { path: "users/:id", element: <ProfilePage /> },
  {
    path: "profile/edit",
    element: (
      <RequireAuth>
        <ProfileEditPage />
      </RequireAuth>
    ),
  },
];
