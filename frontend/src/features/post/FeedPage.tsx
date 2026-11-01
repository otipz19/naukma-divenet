import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { api } from "../../api/client";
import { Alert } from "../../components/Alert/Alert";
import { buttonClassName } from "../../components/Button/Button";
import { SelectField } from "../../components/SelectField/SelectField";
import { useSession } from "../auth/useSession";
import { useDrafts, useFeed } from "./api";
import { DraftList } from "./DraftList";
import { PostCard } from "./PostCard";
import { PostPager } from "./PostPager";
import styles from "./Post.module.css";

/** The feed at `/feed`; its filters and page live in the URL (spec post/feed, design D4). */
export function FeedPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const session = useSession();
  const country = params.get("country") ?? "";
  const region = params.get("region") ?? "";
  const siteParam = Number(params.get("site"));
  const siteId = Number.isInteger(siteParam) && siteParam > 0 ? siteParam : undefined;
  const pageParam = Number(params.get("page"));
  const page = Number.isInteger(pageParam) && pageParam > 1 ? pageParam - 1 : 0;

  const feed = useFeed({
    countryCode: country || undefined,
    regionCode: region || undefined,
    siteId,
    page,
  });
  const signedIn = session.status === "signedIn";
  const drafts = useDrafts(signedIn);
  const countries = useQuery({
    queryKey: ["countries"],
    queryFn: async () => (await api.GET("/api/v1/countries")).data ?? [],
  });
  const site = useQuery({
    queryKey: ["posts", "feed-site", siteId],
    queryFn: async () =>
      (await api.GET("/api/v1/sites/{id}", { params: { path: { id: siteId! } } })).data,
    enabled: siteId !== undefined,
  });

  // Changing a filter returns to the first page; changing the country also clears the region.
  const filter = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    next.delete("page");
    for (const [name, value] of Object.entries(changes)) {
      if (value) next.set(name, value);
      else next.delete(name);
    }
    setParams(next);
  };
  const goTo = (target: number) => {
    const next = new URLSearchParams(params);
    if (target === 0) next.delete("page");
    else next.set("page", String(target + 1));
    setParams(next);
    // Next sits below the list, so the new page would otherwise open at its end.
    window.scrollTo(0, 0);
  };

  const shownCountries = countries.data?.filter((item) => !country || item.code === country) ?? [];
  const posts = feed.data?.content ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.feedHead}>
        <h1 className={`h1 ${styles.flush}`}>{t("post.feed.title")}</h1>
        <div className={styles.filters}>
          <SelectField
            label={t("post.feed.country")}
            value={country}
            onChange={(event) => filter({ country: event.target.value, region: "" })}
          >
            <option value="">{t("post.feed.allCountries")}</option>
            {countries.data?.map((item) => (
              <option key={item.code} value={item.code}>
                {t(`geo.countries.${item.code}`)}
              </option>
            ))}
          </SelectField>
          <SelectField
            label={t("post.feed.region")}
            value={region}
            onChange={(event) => filter({ region: event.target.value })}
          >
            <option value="">{t("post.feed.allRegions")}</option>
            {shownCountries.map((item) => (
              <optgroup key={item.code} label={t(`geo.countries.${item.code}`)}>
                {item.regions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {t(`geo.regions.${option.code}`)}
                  </option>
                ))}
              </optgroup>
            ))}
          </SelectField>
          {signedIn && (
            <Link className={buttonClassName({ variant: "primary" })} to="/posts/new">
              {t("post.profile.write")}
            </Link>
          )}
        </div>
      </div>
      {siteId !== undefined && (
        <p className={`body ${styles.flush}`}>
          {site.data
            ? t("post.feed.siteFilter", { name: site.data.name })
            : t("post.feed.siteFilterGeneric")}{" "}
          <Link to="/feed">{t("post.feed.allPosts")}</Link>
        </p>
      )}
      <div className={styles.columns}>
        <section className={styles.section} aria-label={t("post.feed.posts")}>
          {feed.isError && (
            <Alert tone="danger" live>
              {t("post.loadError")}
            </Alert>
          )}
          {feed.isSuccess && posts.length === 0 && (
            <span className={`body ${styles.muted}`}>{t("post.feed.empty")}</span>
          )}
          {posts.map((post) => (
            <PostCard key={post.id} post={post} showAuthor />
          ))}
          <PostPager page={page} totalPages={feed.data?.page?.totalPages ?? 0} onChange={goTo} />
        </section>
        {signedIn && (drafts.data?.content?.length ?? 0) > 0 && (
          <aside className={styles.draftsAside}>
            <DraftList drafts={drafts.data?.content ?? []} />
          </aside>
        )}
      </div>
    </div>
  );
}
