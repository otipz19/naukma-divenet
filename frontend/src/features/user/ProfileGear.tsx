import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { api } from "../../api/client";
import { Alert } from "../../components/Alert/Alert";
import { Button } from "../../components/Button/Button";
import { TextField } from "../../components/TextField/TextField";
import styles from "./Certificates.module.css";

// Each message is an i18n key, translated where it is shown.
const gearSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "user.gear.errors.nameRequired")
    .max(100, "user.gear.errors.nameTooLong"),
});
type GearValues = z.infer<typeof gearSchema>;

/** The gear locker on a profile (spec user/profile); only the owner gets the controls. */
export function ProfileGear({ userId, own }: { userId: number; own: boolean }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [failed, setFailed] = useState(false);
  const queryKey = ["gear-locker", userId];
  const locker = useQuery({
    queryKey,
    queryFn: async () =>
      (await api.GET("/api/v1/users/{id}/gear-locker", { params: { path: { id: userId } } }))
        .data ?? [],
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GearValues>({ resolver: zodResolver(gearSchema), defaultValues: { name: "" } });
  const items = locker.data ?? [];

  const run = async (request: () => Promise<unknown>) => {
    setFailed(false);
    try {
      await request();
      await queryClient.invalidateQueries({ queryKey });
      return true;
    } catch {
      setFailed(true);
      return false;
    }
  };
  const onSubmit = handleSubmit(async ({ name }) => {
    if (await run(() => api.POST("/api/v1/gear-locker", { body: { name } }))) reset();
  });

  if (locker.isError) {
    return (
      <Alert tone="danger" live>
        {t("user.gear.loadError")}
      </Alert>
    );
  }
  if (!locker.isSuccess || (items.length === 0 && !own)) return null;
  return (
    <section className={styles.section}>
      <h2 className={`h2 ${styles.flush}`}>{t("user.gear.title")}</h2>
      {items.length === 0 && <span className={`body ${styles.muted}`}>{t("user.gear.none")}</span>}
      <div className={styles.cards}>
        {items.map((item) => (
          <div key={item.id} className={`${styles.card} ${styles.gearItem}`}>
            <span className="label">{item.name}</span>
            {own && (
              <Button
                variant="ghost"
                size="sm"
                aria-label={t("user.gear.removeOne", { name: item.name })}
                onClick={() =>
                  void run(() =>
                    api.DELETE("/api/v1/gear-locker/{id}", { params: { path: { id: item.id } } }),
                  )
                }
              >
                {t("user.gear.remove")}
              </Button>
            )}
          </div>
        ))}
      </div>
      {failed && (
        <Alert tone="danger" live>
          {t("user.gear.failure")}
        </Alert>
      )}
      {own && (
        <form className={styles.gearForm} noValidate onSubmit={(event) => void onSubmit(event)}>
          <TextField
            label={t("user.gear.name")}
            error={errors.name?.message ? t(errors.name.message) : undefined}
            {...register("name")}
          />
          <Button type="submit" disabled={isSubmitting}>
            {t("user.gear.add")}
          </Button>
        </form>
      )}
    </section>
  );
}
