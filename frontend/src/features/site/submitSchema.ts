import { z } from "zod";

// Each message is an i18n key, translated where it is shown. Numbers stay strings while being edited.
const number = (required: string, invalid: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, required)
    .refine((value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed >= min && parsed <= max;
    }, invalid);

const depth = number(
  "site.submit.errors.depthRequired",
  "site.submit.errors.depthInvalid",
  0,
  400,
).refine((value) => Number.isInteger(Number(value)), "site.submit.errors.depthInvalid");

export const submitSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "site.submit.errors.nameRequired")
      .max(120, "site.submit.errors.nameTooLong"),
    lat: number("site.submit.errors.locationRequired", "site.submit.errors.latInvalid", -90, 90),
    lng: number("site.submit.errors.locationRequired", "site.submit.errors.lngInvalid", -180, 180),
    country: z.string().min(1, "site.submit.errors.countryRequired"),
    regionCode: z.string().min(1, "site.submit.errors.regionRequired"),
    minDepth: depth,
    maxDepth: depth,
    difficulty: z.string().min(1, "site.submit.errors.difficultyRequired"),
    description: z
      .string()
      .trim()
      .min(1, "site.submit.errors.descriptionRequired")
      .max(5000, "site.submit.errors.descriptionTooLong"),
  })
  .refine((values) => Number(values.minDepth) <= Number(values.maxDepth), {
    path: ["minDepth"],
    message: "site.submit.errors.depthOrder",
  });

export type SubmitValues = z.infer<typeof submitSchema>;

/** A longitude from a map that wraps around the world, back within -180 to 180. */
export function wrapLongitude(lng: number): number {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}
