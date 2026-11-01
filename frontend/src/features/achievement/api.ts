import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { components } from "../../api/schema.gen";

export type Achievement = components["schemas"]["AchievementResponse"];

export function useAchievements(userId: number) {
  return useQuery({
    queryKey: ["achievements", userId],
    queryFn: async () =>
      (await api.GET("/api/v1/users/{id}/achievements", { params: { path: { id: userId } } }))
        .data ?? [],
    enabled: userId > 0,
  });
}
