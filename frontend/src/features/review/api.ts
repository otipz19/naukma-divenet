import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../api/ApiError";
import { api } from "../../api/client";
import type { components } from "../../api/schema.gen";
import { useSession } from "../auth/useSession";

export type Review = components["schemas"]["ReviewResponse"];
export type ReviewRequest = components["schemas"]["ReviewRequest"];
export type ReviewSort = "newest" | "rating";

/** Query keys (design D7); a review write invalidates `all(siteId)` and `["sites"]`. */
export const reviewKeys = {
  all: (siteId: number) => ["reviews", siteId] as const,
  list: (siteId: number, sort: ReviewSort) => ["reviews", siteId, sort] as const,
  mine: (siteId: number, userId: number | undefined) =>
    ["reviews", siteId, "mine", userId] as const,
};

export const REVIEW_PAGE_SIZE = 10;

export async function fetchReviews(siteId: number, sort: ReviewSort, page: number) {
  const { data } = await api.GET("/api/v1/sites/{siteId}/reviews", {
    params: { path: { siteId }, query: { sort, page, size: REVIEW_PAGE_SIZE } },
  });
  return data!;
}

/** The signed-in user's review of the site, or null when they have none (a 404). */
async function fetchMyReview(siteId: number): Promise<Review | null> {
  try {
    const { data } = await api.GET("/api/v1/sites/{siteId}/reviews/mine", {
      params: { path: { siteId } },
    });
    return data!;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** Undefined while loading or signed out; null when the user has not reviewed the site. */
export function useMyReview(siteId: number, enabled = true) {
  const session = useSession();
  const userId = session.status === "signedIn" ? session.user.id : undefined;
  return useQuery({
    queryKey: reviewKeys.mine(siteId, userId),
    queryFn: () => fetchMyReview(siteId),
    enabled: enabled && userId !== undefined,
  });
}

export async function createReview(siteId: number, body: ReviewRequest) {
  const { data } = await api.POST("/api/v1/sites/{siteId}/reviews", {
    params: { path: { siteId } },
    body,
  });
  return data!;
}

export async function updateReview(id: number, body: ReviewRequest) {
  const { data } = await api.PUT("/api/v1/reviews/{id}", { params: { path: { id } }, body });
  return data!;
}

export async function deleteReview(id: number) {
  await api.DELETE("/api/v1/reviews/{id}", { params: { path: { id } } });
}

/** After a write: the site's reviews, its aggregates and the map's markers are stale. */
export function useInvalidateReviews() {
  const queryClient = useQueryClient();
  return (siteId: number) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: reviewKeys.all(siteId) }),
      queryClient.invalidateQueries({ queryKey: ["sites"] }),
    ]);
}
