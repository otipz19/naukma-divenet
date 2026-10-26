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
import { loginSchema, type LoginValues } from "./schemas";
import { useSession } from "./useSession";

/** Spec auth "The web app has a login page" (design/screens/Auth.html). */
export function LoginPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const session = useSession();
  const [failure, setFailure] = useState<"credentials" | "generic">();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Signing in re-renders this page signed in, which sends the user on.
  if (session.status === "signedIn") return <Navigate to={redirectTarget(location)} replace />;

  const onSubmit = handleSubmit(async (values) => {
    setFailure(undefined);
    try {
      const { data } = await api.POST("/api/v1/auth/login", { body: values });
      if (data) signIn(data);
    } catch (error) {
      setFailure(error instanceof ApiError && error.status === 401 ? "credentials" : "generic");
    }
  });

  const message = (key?: string) => (key ? t(key) : undefined);

  return (
    <div className={styles.page}>
      <form className={styles.card} noValidate onSubmit={(event) => void onSubmit(event)}>
        <h1 className={`h1 ${styles.title}`}>{t("auth.login.title")}</h1>
        {failure && (
          <Alert tone="danger" live>
            {t(failure === "credentials" ? "auth.login.failed" : "auth.errors.generic")}
          </Alert>
        )}
        <TextField
          label={t("auth.login.email")}
          type="email"
          autoComplete="email"
          error={message(errors.email?.message)}
          {...register("email")}
        />
        <TextField
          label={t("auth.login.password")}
          type="password"
          autoComplete="current-password"
          error={message(errors.password?.message)}
          {...register("password")}
        />
        <Button type="submit" disabled={isSubmitting}>
          {t(isSubmitting ? "auth.login.submitting" : "auth.login.submit")}
        </Button>
        <p className={`body-sm ${styles.switch}`}>
          {t("auth.login.newHere")}{" "}
          <Link to="/register" state={location.state as FromState | null}>
            {t("auth.login.createAccount")}
          </Link>
        </p>
      </form>
    </div>
  );
}
