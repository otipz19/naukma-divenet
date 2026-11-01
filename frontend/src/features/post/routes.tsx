import type { RouteObject } from "react-router";
import { RequireAuth } from "../auth/RequireAuth";
import { PostEditorPage } from "./PostEditorPage";
import { PostPage } from "./PostPage";

/** The post pages; src/app/router.tsx adds them to the layout route. */
export const postRoutes: RouteObject[] = [
  {
    path: "posts/new",
    element: (
      <RequireAuth>
        <PostEditorPage />
      </RequireAuth>
    ),
  },
  { path: "posts/:id", element: <PostPage /> },
  {
    path: "posts/:id/edit",
    element: (
      <RequireAuth>
        <PostEditorPage />
      </RequireAuth>
    ),
  },
];
