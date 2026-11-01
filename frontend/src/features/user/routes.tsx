import type { RouteObject } from "react-router";
import { RequireAuth } from "../auth/RequireAuth";
import { CertificatesPage } from "./CertificatesPage";
import { ProfileEditPage } from "./ProfileEditPage";
import { ProfilePage } from "./ProfilePage";

/** The profile pages; src/app/router.tsx adds them to the layout route. */
export const userRoutes: RouteObject[] = [
  { path: "users/:id", element: <ProfilePage /> },
  {
    path: "profile/certificates",
    element: (
      <RequireAuth>
        <CertificatesPage />
      </RequireAuth>
    ),
  },
  {
    path: "profile/edit",
    element: (
      <RequireAuth>
        <ProfileEditPage />
      </RequireAuth>
    ),
  },
];
