import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import {
  RouterProvider,
  createMemoryRouter,
  type InitialEntry,
  type RouteObject,
} from "react-router";
import { createQueryClient } from "../app/queryClient";
import { buildRoutes } from "../app/router";
import { DISCLAIMER_STORAGE_KEY } from "../features/disclaimer/disclaimerStorage";
import { createI18n } from "../i18n";

/**
 * Renders the app's real routes at `path` (a location may carry router state), with fresh i18n and
 * query-cache instances. The visitor has dismissed the first-visit disclaimer unless `firstVisit`.
 * `extraRoutes` adds test-only pages inside the shell, under the same error route as the real ones.
 */
export function renderRoute(
  path: InitialEntry,
  {
    language = "en",
    firstVisit = false,
    extraRoutes = [],
  }: { language?: string; firstVisit?: boolean; extraRoutes?: RouteObject[] } = {},
) {
  if (!firstVisit) localStorage.setItem(DISCLAIMER_STORAGE_KEY, "dismissed");
  const router = createMemoryRouter(buildRoutes(extraRoutes), { initialEntries: [path] });
  return render(
    <I18nextProvider i18n={createI18n(language)}>
      <QueryClientProvider client={createQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </I18nextProvider>,
  );
}
