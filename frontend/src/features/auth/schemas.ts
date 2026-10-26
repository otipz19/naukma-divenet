import { z } from "zod";

// Each message is an i18n key, translated where it is shown (design D10).

/** bcrypt reads 72 bytes; the back-end refuses longer passwords (spec auth). */
const MAX_PASSWORD_BYTES = 72;

const email = z
  .string()
  .trim()
  .min(1, "auth.errors.emailRequired")
  .pipe(z.email("auth.errors.emailInvalid"));

export const loginSchema = z.object({
  email: z.string().trim().min(1, "auth.errors.emailRequired"),
  password: z.string().min(1, "auth.errors.passwordRequired"),
});

export const registerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "auth.errors.displayNameRequired")
    .max(50, "auth.errors.displayNameTooLong"),
  email: email.pipe(z.string().max(254, "auth.errors.emailInvalid")),
  password: z
    .string()
    .min(8, "auth.errors.passwordTooShort")
    .refine(
      (value) => new TextEncoder().encode(value).length <= MAX_PASSWORD_BYTES,
      "auth.errors.passwordTooLong",
    ),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
