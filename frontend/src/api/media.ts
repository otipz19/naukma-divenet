import { api } from "./client";
import type { components } from "./schema.gen";

export type UploadedMedia = components["schemas"]["MediaResponse"];
export type UploadedVideo = components["schemas"]["VideoResponse"];

/** The server's limits (spec media/uploads); the server checks again, by content. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const VIDEO_TYPES = ["video/mp4", "video/webm"];

/**
 * Uploads one image as the signed-in user. It goes through the typed client, so it sends the
 * access token, refreshes once on a 401, and fails with `ApiError` like every other call.
 */
export async function uploadMedia(file: File): Promise<UploadedMedia> {
  const { data } = await api.POST("/api/v1/media", {
    // The contract types a binary part as a string; the serializer sends the file itself.
    body: { file: file as unknown as string },
    bodySerializer: () => {
      const form = new FormData();
      form.append("file", file);
      return form;
    },
  });
  return data as UploadedMedia;
}

/** Uploads one video, as `uploadMedia` does an image. */
export async function uploadVideo(file: File): Promise<UploadedVideo> {
  const { data } = await api.POST("/api/v1/media/videos", {
    body: { file: file as unknown as string },
    bodySerializer: () => {
      const form = new FormData();
      form.append("file", file);
      return form;
    },
  });
  return data as UploadedVideo;
}
