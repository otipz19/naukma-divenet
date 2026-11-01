import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { components } from "../../api/schema.gen";

export type Post = components["schemas"]["PostResponse"];
export type PostSummary = components["schemas"]["PostSummaryResponse"];
export type PostRequest = components["schemas"]["PostRequest"];

export function usePost(id: number) {
  return useQuery({
    queryKey: ["posts", id],
    queryFn: async () =>
      (await api.GET("/api/v1/posts/{id}", { params: { path: { id } } })).data as Post,
    enabled: Number.isInteger(id),
  });
}

export function useBlog(userId: number, page: number) {
  return useQuery({
    queryKey: ["posts", "blog", userId, page],
    queryFn: async () =>
      (
        await api.GET("/api/v1/users/{id}/posts", {
          params: { path: { id: userId }, query: { page } },
        })
      ).data,
    placeholderData: keepPreviousData,
  });
}

export function useFeed(query: {
  countryCode?: string;
  regionCode?: string;
  siteId?: number;
  page: number;
  size?: number;
}) {
  return useQuery({
    queryKey: ["posts", "feed", query],
    queryFn: async () => (await api.GET("/api/v1/posts", { params: { query } })).data,
    placeholderData: keepPreviousData,
  });
}

/** Enabled only for the owner: nobody else's drafts are even requested. */
export function useDrafts(enabled: boolean) {
  return useQuery({
    queryKey: ["posts", "drafts"],
    queryFn: async () => (await api.GET("/api/v1/posts/drafts")).data,
    enabled,
  });
}

export function useInvalidatePosts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["posts"] });
}
