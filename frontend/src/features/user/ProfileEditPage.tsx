import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { api } from "../../api/client";
import { Alert } from "../../components/Alert/Alert";
import { Button, buttonClassName } from "../../components/Button/Button";
import { PhotoField, type PhotoFieldItem } from "../../components/PhotoField/PhotoField";
import { TextAreaField } from "../../components/TextField/TextAreaField";
import { useSession } from "../auth/useSession";
import { useProfile, type Profile } from "./api";
import styles from "./ProfileEditPage.module.css";

// Each message is an i18n key, translated where it is shown.
const profileSchema = z.object({
  bio: z.string().max(500, "user.edit.bioTooLong"),
  photos: z.array(z.custom<PhotoFieldItem>()).max(1),
  showDiveLog: z.boolean(),
  showStatistics: z.boolean(),
  showCertificates: z.boolean(),
});
type ProfileValues = z.infer<typeof profileSchema>;

const SETTINGS = [
  ["showDiveLog", "user.edit.showDiveLog"],
  ["showStatistics", "user.edit.showStatistics"],
  ["showCertificates", "user.edit.showCertificates"],
] as const;

/** The edit page at `/profile/edit`, inside `RequireAuth` (spec user/profile). */
export function ProfileEditPage() {
  const { t } = useTranslation();
  const session = useSession();
  const id = session.status === "signedIn" ? session.user.id : 0;
  const profile = useProfile(id, id !== 0);

  return (
    <div className={styles.page}>
      {profile.isError && (
        <Alert tone="danger" live>
          {t("user.profile.loadError")}
        </Alert>
      )}
      {profile.data && <ProfileForm profile={profile.data} />}
    </div>
  );
}

function ProfileForm({ profile }: { profile: Profile }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [failed, setFailed] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: profile.bio ?? "",
      photos: profile.avatar ? [profile.avatar] : [],
      showDiveLog: profile.showDiveLog,
      showStatistics: profile.showStatistics,
      showCertificates: profile.showCertificates,
    },
  });
  const profilePath = `/users/${profile.id}`;

  const onSubmit = handleSubmit(async ({ bio, photos, ...settings }) => {
    setFailed(false);
    try {
      await api.PUT("/api/v1/users/me", {
        body: { ...settings, bio: bio.trim() || undefined, avatarId: photos[0]?.id },
      });
      // Reviews show the avatar too, so every cached list may be out of date.
      await queryClient.invalidateQueries();
      await navigate(profilePath);
    } catch {
      setFailed(true);
    }
  });

  return (
    <form className={styles.form} noValidate onSubmit={(event) => void onSubmit(event)}>
      <h1 className={`h1 ${styles.flush}`}>{t("user.edit.title")}</h1>
      <Controller
        control={control}
        name="photos"
        render={({ field }) => (
          <PhotoField
            label={t("user.edit.avatar")}
            value={field.value}
            onChange={field.onChange}
            max={1}
          />
        )}
      />
      <TextAreaField
        label={t("user.edit.bio")}
        error={errors.bio?.message ? t(errors.bio.message) : undefined}
        {...register("bio")}
      />
      <fieldset className={styles.settings}>
        <legend className="label">{t("user.edit.privacy")}</legend>
        <p className={`body-sm ${styles.hint}`}>{t("user.edit.privacyHint")}</p>
        {SETTINGS.map(([name, label]) => (
          <label key={name} className={`body ${styles.setting}`}>
            <input type="checkbox" {...register(name)} />
            {t(label)}
          </label>
        ))}
      </fieldset>
      {failed && (
        <Alert tone="danger" live>
          {t("user.edit.failure")}
        </Alert>
      )}
      <div className={styles.actions}>
        <Link className={buttonClassName({ variant: "secondary" })} to={profilePath}>
          {t("user.edit.cancel")}
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {t("user.edit.save")}
        </Button>
      </div>
    </form>
  );
}
