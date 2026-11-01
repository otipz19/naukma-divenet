import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router";
import { z } from "zod";
import { ApiError } from "../../api/ApiError";
import { api } from "../../api/client";
import { Alert } from "../../components/Alert/Alert";
import { Badge } from "../../components/Badge/Badge";
import { Button } from "../../components/Button/Button";
import { PhotoField, type PhotoFieldItem } from "../../components/PhotoField/PhotoField";
import { SelectField } from "../../components/SelectField/SelectField";
import { TextAreaField } from "../../components/TextField/TextAreaField";
import { TextField } from "../../components/TextField/TextField";
import { useSession } from "../auth/useSession";
import { SitePicker, type PickedSite } from "../divelog/SitePicker";
import { useInvalidatePosts, usePost, type Post, type PostRequest } from "./api";
import styles from "./Post.module.css";

// Each message is an i18n key, translated where it is shown.
const postSchema = z.object({
  title: z.string().trim().min(1, "post.errors.titleRequired").max(200, "post.errors.titleTooLong"),
  text: z.string().max(20000, "post.errors.textTooLong"),
  cover: z.array(z.custom<PhotoFieldItem>()).max(1),
  photos: z.array(z.custom<PhotoFieldItem>()).max(10),
  regionCode: z.string(),
  site: z.custom<PickedSite | null>(),
});
type PostValues = z.infer<typeof postSchema>;

type Status = PostRequest["status"];

/** The editor at `/posts/new` and `/posts/:id/edit`, inside `RequireAuth` (spec post/editor). */
export function PostEditorPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const postId = id === undefined ? undefined : Number(id);
  const post = usePost(postId ?? Number.NaN);
  const session = useSession();

  if (postId === undefined) return <PostForm key="new" post={null} />;
  const mine =
    post.data && session.status === "signedIn" && post.data.author.id === session.user.id;
  const missing =
    !Number.isInteger(postId) ||
    (post.error instanceof ApiError && post.error.status === 404) ||
    (post.data && !mine);
  if (missing) {
    return (
      <div className={styles.page}>
        <h1 className={`h1 ${styles.flush}`}>{t("post.notFound")}</h1>
      </div>
    );
  }
  if (post.isError) {
    return (
      <div className={styles.page}>
        <Alert tone="danger" live>
          {t("post.loadError")}
        </Alert>
      </div>
    );
  }
  return post.data ? <PostForm key={post.data.id} post={post.data} /> : null;
}

function PostForm({ post }: { post: Post | null }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const invalidate = useInvalidatePosts();
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState(Boolean((location.state as { saved?: boolean })?.saved));
  const [confirming, setConfirming] = useState(false);
  // The site's region, so another region can clear a site outside it.
  const [siteRegion, setSiteRegion] = useState(post?.site ? post.regionCode : undefined);
  const countries = useQuery({
    queryKey: ["countries"],
    queryFn: async () => (await api.GET("/api/v1/countries")).data ?? [],
  });
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<PostValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: post?.title ?? "",
      text: post?.text ?? "",
      cover: post?.cover ? [post.cover] : [],
      photos: post?.photos ?? [],
      regionCode: post?.regionCode ?? "",
      site: post?.site ?? null,
    },
  });
  // The select cannot show a value before its option exists, so it is set again once they load.
  useEffect(() => {
    if (countries.data) setValue("regionCode", getValues("regionCode"));
  }, [countries.data, getValues, setValue]);
  const message = (key?: string) => (key ? t(key) : undefined);

  const pickSite = async (site: PickedSite | null) => {
    setValue("site", site);
    setSiteRegion(undefined);
    if (!site) return;
    const { data } = await api.GET("/api/v1/sites/{id}", { params: { path: { id: site.id } } });
    if (data && getValues("site")?.id === site.id) {
      setValue("regionCode", data.regionCode);
      setSiteRegion(data.regionCode);
    }
  };

  const save = (status: Status) =>
    handleSubmit(async (values) => {
      if (status === "PUBLISHED" && !values.text.trim()) {
        setError("text", { message: "post.errors.textRequired" });
        return;
      }
      setFailed(false);
      setSaved(false);
      const body: PostRequest = {
        title: values.title,
        text: values.text,
        status,
        coverId: values.cover[0]?.id,
        photoIds: values.photos.map((photo) => photo.id),
        regionCode: values.regionCode || undefined,
        siteId: values.site?.id,
      };
      try {
        const { data } = post
          ? await api.PUT("/api/v1/posts/{id}", { params: { path: { id: post.id } }, body })
          : await api.POST("/api/v1/posts", { body });
        await invalidate();
        if (status === "PUBLISHED") {
          void navigate(`/posts/${data!.id}`);
        } else if (post) {
          setSaved(true);
        } else {
          void navigate(`/posts/${data!.id}/edit`, { replace: true, state: { saved: true } });
        }
      } catch {
        setFailed(true);
      }
    })();

  const remove = async () => {
    setFailed(false);
    try {
      await api.DELETE("/api/v1/posts/{id}", { params: { path: { id: post!.id } } });
      await invalidate();
      void navigate(`/users/${post!.author.id}`);
    } catch {
      setConfirming(false);
      setFailed(true);
    }
  };

  const published = post?.status === "PUBLISHED";
  return (
    <form
      className={styles.editor}
      noValidate
      aria-label={t(post ? "post.editor.editTitle" : "post.editor.newTitle")}
      onSubmit={(event) => {
        event.preventDefault();
        void save(post?.status ?? "DRAFT");
      }}
    >
      <div className={styles.editorMain}>
        <h1 className={`h1 ${styles.flush}`}>
          {t(post ? "post.editor.editTitle" : "post.editor.newTitle")}
        </h1>
        <div className={styles.links}>
          <Badge tone={published ? "success" : "info"}>
            {t(published ? "post.published" : "post.draft")}
          </Badge>
          {saved && (
            <span className={`body-sm ${styles.muted}`} role="status">
              {t("post.editor.saved")}
            </span>
          )}
        </div>
        <TextField
          label={t("post.editor.title")}
          error={message(errors.title?.message)}
          {...register("title")}
        />
        <Controller
          control={control}
          name="cover"
          render={({ field }) => (
            <PhotoField
              label={t("post.editor.cover")}
              value={field.value}
              onChange={field.onChange}
              max={1}
            />
          )}
        />
        <TextAreaField
          label={t("post.editor.text")}
          hint={t("post.editor.textHint")}
          rows={14}
          error={message(errors.text?.message)}
          {...register("text")}
        />
        <Controller
          control={control}
          name="photos"
          render={({ field }) => (
            <PhotoField
              label={t("post.editor.images")}
              value={field.value}
              onChange={field.onChange}
              max={10}
            />
          )}
        />
      </div>
      <aside className={styles.publishing}>
        <h2 className={`h3 ${styles.flush}`}>{t("post.editor.publishing")}</h2>
        <SelectField
          label={t("post.editor.region")}
          {...register("regionCode", {
            onChange: (event: { target: { value: string } }) => {
              if (siteRegion !== event.target.value) {
                setValue("site", null);
                setSiteRegion(undefined);
              }
            },
          })}
        >
          <option value="">{t("post.editor.noRegion")}</option>
          {countries.data?.map((country) => (
            <optgroup key={country.code} label={t(`geo.countries.${country.code}`)}>
              {country.regions.map((region) => (
                <option key={region.code} value={region.code}>
                  {t(`geo.regions.${region.code}`)}
                </option>
              ))}
            </optgroup>
          ))}
        </SelectField>
        <Controller
          control={control}
          name="site"
          render={({ field }) => (
            <SitePicker
              value={field.value}
              onChange={(site) => void pickSite(site)}
              hint={t("post.editor.siteHint")}
            />
          )}
        />
        {failed && (
          <Alert tone="danger" live>
            {t("post.editor.failure")}
          </Alert>
        )}
        <div className={styles.buttons}>
          <Button disabled={isSubmitting} onClick={() => void save("PUBLISHED")}>
            {t(published ? "post.editor.saveChanges" : "post.editor.publish")}
          </Button>
          <Button variant="secondary" disabled={isSubmitting} onClick={() => void save("DRAFT")}>
            {t(published ? "post.editor.moveToDrafts" : "post.editor.saveDraft")}
          </Button>
          {post &&
            (confirming ? (
              <div
                className={styles.confirm}
                role="group"
                aria-label={t("post.editor.confirmDelete")}
              >
                <span className="body-sm">{t("post.editor.confirmDelete")}</span>
                <Button variant="danger" size="sm" onClick={() => void remove()}>
                  {t("post.editor.confirmYes")}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                  {t("post.editor.confirmNo")}
                </Button>
              </div>
            ) : (
              <Button variant="danger" onClick={() => setConfirming(true)}>
                {t("post.editor.delete")}
              </Button>
            ))}
        </div>
      </aside>
    </form>
  );
}
