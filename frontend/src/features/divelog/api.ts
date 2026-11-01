import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { components } from "../../api/schema.gen";

export type DiveEntry = components["schemas"]["EntryResponse"];
export type DiveEntryRequest = components["schemas"]["EntryRequest"];

/** "12 May 2026". The date is a calendar day, so it must not shift with the viewer's time zone (design D4). */
export function formatDiveDate(date: string, language: string): string {
  const locale = language === "en" ? "en-GB" : language;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

/** "30.4" in English, "30,4" in Ukrainian. */
export function formatDiveNumber(value: number, language: string): string {
  return new Intl.NumberFormat(language).format(value);
}

/** Enabled only when the viewer may see it: a hidden section is not even requested. */
export function useDiveLog(userId: number, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["dive-log", userId],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.GET("/api/v1/users/{id}/dive-log", {
        params: { path: { id: userId }, query: { page: pageParam } },
      });
      return data!;
    },
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.page.number + 1 < last.page.totalPages ? last.page.number + 1 : undefined,
    enabled,
  });
}

export function useDiveStats(userId: number, enabled = true) {
  return useQuery({
    queryKey: ["dive-stats", userId],
    queryFn: async () =>
      (await api.GET("/api/v1/users/{id}/dive-stats", { params: { path: { id: userId } } })).data!,
    enabled,
  });
}

export function useVisitedSites(userId: number, enabled = true) {
  return useQuery({
    queryKey: ["visited-sites", userId],
    queryFn: async () =>
      (await api.GET("/api/v1/users/{id}/visited-sites", { params: { path: { id: userId } } }))
        .data!,
    enabled,
  });
}

export function useInvalidateDiveLog() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      ["dive-log", "dive-stats", "visited-sites"].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      ),
    );
}
