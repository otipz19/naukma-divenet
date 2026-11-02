import { z } from "zod";
import type { UploadedVideo } from "../../api/media";
import type { PhotoFieldItem } from "../../components/PhotoField/PhotoField";

export const MAX_REVIEW_PHOTOS = 6;

// Each message is an i18n key, translated where it is shown. Null is "No rating" or no chip pressed.
export const reviewSchema = z
  .object({
    rating: z.number().int().min(1).max(5).nullable(),
    difficulty: z.number().int().min(1).max(5).nullable(),
    text: z.string().max(4000, "review.form.errors.textTooLong"),
    photos: z.array(z.custom<PhotoFieldItem>()).max(MAX_REVIEW_PHOTOS),
    videos: z.array(z.custom<UploadedVideo>()),
  })
  .refine((values) => values.rating !== null || values.text.trim() !== "", {
    message: "review.form.errors.ratingOrText",
    path: ["text"],
  });

export type ReviewValues = z.infer<typeof reviewSchema>;

export const EMPTY_REVIEW: ReviewValues = {
  rating: null,
  difficulty: null,
  text: "",
  photos: [],
  videos: [],
};
