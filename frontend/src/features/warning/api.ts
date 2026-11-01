import { useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { components } from "../../api/schema.gen";

export type Warning = components["schemas"]["WarningResponse"];
export type WarningRequest = components["schemas"]["WarningRequest"];
export type WarningType = Warning["type"];

export const WARNING_PAGE_SIZE = 10;

export const warningKeys = {
  all: (siteId: number) => ["warnings", siteId] as const,
  detail: (id: number) => ["warning", id] as const,
};

export async function fetchWarnings(siteId: number, page: number) {
  const { data } = await api.GET("/api/v1/sites/{siteId}/warnings", {
    params: { path: { siteId }, query: { page, size: WARNING_PAGE_SIZE } },
  });
  return data!;
}

export async function fetchWarning(id: number) {
  const { data } = await api.GET("/api/v1/warnings/{id}", {
    params: { path: { id } },
  });
  return data!;
}

export async function createWarning(siteId: number, body: WarningRequest) {
  const { data } = await api.POST("/api/v1/sites/{siteId}/warnings", {
    params: { path: { siteId } },
    body,
  });
  return data!;
}

export async function updateWarning(id: number, body: WarningRequest) {
  const { data } = await api.PUT("/api/v1/warnings/{id}", {
    params: { path: { id } },
    body,
  });
  return data!;
}

export async function deleteWarning(id: number) {
  await api.DELETE("/api/v1/warnings/{id}", { params: { path: { id } } });
}

export async function hideWarning(id: number) {
  await api.POST("/api/v1/admin/warnings/{id}/hide", {
    params: { path: { id } },
  });
}

export function useInvalidateWarnings() {
  const queryClient = useQueryClient();
  return (siteId: number) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: warningKeys.all(siteId) }),
      queryClient.invalidateQueries({ queryKey: ["warning"] }),
    ]);
}
