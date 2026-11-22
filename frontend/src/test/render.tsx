import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { RouterProvider, createMemoryRouter, type InitialEntry } from "react-router";
import { createQueryClient } from "../app/queryClient";
import { routes } from "../app/router";
import { DISCLAIMER_STORAGE_KEY } from "../features/disclaimer/disclaimerStorage";
import { createI18n } from "../i18n";

/**
 * Renders the app's real routes at `path` (a location may carry router state), with fresh i18n and
 * query-cache instances. The visitor has dismissed the first-visit disclaimer unless `firstVisit`.
 */
export function renderRoute(
  path: InitialEntry,
  { language = "en", firstVisit = false }: { language?: string; firstVisit?: boolean } = {},
) {
  if (!firstVisit) localStorage.setItem(DISCLAIMER_STORAGE_KEY, "dismissed");
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(
    <I18nextProvider i18n={createI18n(language)}>
      <QueryClientProvider client={createQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </I18nextProvider>,
  );
}
