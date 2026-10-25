import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "../api/ApiError";

const MAX_RETRIES = 2;

/** Client errors (4xx) will not succeed on retry; network and server errors may. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status !== undefined && error.status < 500) return false;
  return failureCount < MAX_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: shouldRetry },
    },
  });
}
