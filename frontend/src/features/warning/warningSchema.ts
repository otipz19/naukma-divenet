import { z } from "zod";
import type { WarningType } from "./api";

export const WARNING_TYPES: readonly WarningType[] = [
  "HAZARD",
  "INCIDENT",
  "CHANGED_CONDITIONS",
  "MARINE_LIFE",
];

// Each message is an i18n key, translated where it is shown.
export const warningSchema = z.object({
  type: z.string().refine((val) => (WARNING_TYPES as readonly string[]).includes(val), {
    message: "warning.form.errors.typeRequired",
  }),
  text: z
    .string()
    .refine((val) => val.trim().length > 0, {
      message: "warning.form.errors.textRequired",
    })
    .refine((val) => val.length <= 1000, {
      message: "warning.form.errors.textTooLong",
    }),
});

export type WarningFormValues = z.infer<typeof warningSchema>;

export const EMPTY_WARNING: WarningFormValues = {
  type: "",
  text: "",
};
