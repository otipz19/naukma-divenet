import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useLocation } from "react-router";
import { ApiError } from "../../api/ApiError";
import { api } from "../../api/client";
import { signIn } from "../../api/session";
import { Alert } from "../../components/Alert/Alert";
import { Button } from "../../components/Button/Button";
import { TextField } from "../../components/TextField/TextField";
import styles from "./AuthPage.module.css";
import { redirectTarget, type FromState } from "./redirect";
import { registerSchema, type RegisterValues } from "./schemas";
import { useSession } from "./useSession";

const FIELDS = ["displayName", "email", "password"] as const;

/** Spec auth "The web app has a sign-up page" (design/screens/Auth.html). */
export function RegisterPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const session = useSession();
  const [generic, setGeneric] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", email: "", password: "" },
  });

  if (session.status === "signedIn") return <Navigate to={redirectTarget(location)} replace />;

  const onSubmit = handleSubmit(async (values) => {
    setGeneric(false);
    try {
      const { data } = await api.POST("/api/v1/auth/register", { body: values });
      if (data) signIn(data);
    } catch (error) {
      if (!(error instanceof ApiError) || error.kind === "network") {
        setGeneric(true);
        return;
      }
      if (error.status === 409) {
        setError("email", { message: "auth.errors.emailTaken" });
        return;
      }
      // The server's English messages are never shown; each field gets its own translated rule.
      const invalid = FIELDS.filter((field) =>
        error.problem?.errors.some((e) => e.field === field),
      );
      for (const field of invalid) setError(field, { message: `auth.errors.server.${field}` });
      if (invalid.length === 0) setGeneric(true);
    }
  });

  const message = (key?: string) => (key ? t(key) : undefined);

  return (
    <div className={styles.page}>
      <form className={styles.card} noValidate onSubmit={(event) => void onSubmit(event)}>
        <h1 className={`h1 ${styles.title}`}>{t("auth.register.title")}</h1>
        {generic && (
          <Alert tone="danger" live>
            {t("auth.errors.generic")}
          </Alert>
        )}
        <TextField
          label={t("auth.register.displayName")}
          hint={t("auth.register.displayNameHint")}
          autoComplete="nickname"
          error={message(errors.displayName?.message)}
          {...register("displayName")}
        />
        <TextField
          label={t("auth.register.email")}
          type="email"
          autoComplete="email"
          error={message(errors.email?.message)}
          {...register("email")}
        />
        <TextField
          label={t("auth.register.password")}
          type="password"
          autoComplete="new-password"
          error={message(errors.password?.message)}
          {...register("password")}
        />
        <Button type="submit" disabled={isSubmitting}>
          {t(isSubmitting ? "auth.register.submitting" : "auth.register.submit")}
        </Button>
        <p className={`body-sm ${styles.switch}`}>
          {t("auth.register.haveAccount")}{" "}
          <Link to="/login" state={location.state as FromState | null}>
            {t("auth.register.logIn")}
          </Link>
        </p>
      </form>
    </div>
  );
}
