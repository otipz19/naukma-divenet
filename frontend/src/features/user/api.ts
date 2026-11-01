import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { components } from "../../api/schema.gen";

export type Profile = components["schemas"]["ProfileResponse"];

export function useProfile(id: number, enabled = true) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: async () =>
      (await api.GET("/api/v1/users/{id}", { params: { path: { id } } })).data as Profile,
    enabled,
  });
}
