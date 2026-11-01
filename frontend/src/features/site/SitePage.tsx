import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { ApiError } from "../../api/ApiError";
import { api } from "../../api/client";
import type { components } from "../../api/schema.gen";
import { Alert } from "../../components/Alert/Alert";
import { Badge } from "../../components/Badge/Badge";
import { DifficultyBadge } from "../../components/Badge/DifficultyBadge";
import { useSession } from "../auth/useSession";
import styles from "./SitePage.module.css";

type Site = components["schemas"]["SiteResponse"];

/** "28.5722° N, 34.5375° E": hemisphere letters, not signs. */
export function formatCoordinates(lat: number, lng: number): string {
  const part = (value: number, positive: string, negative: string) =>
    `${Math.abs(value).toFixed(4)}° ${value < 0 ? negative : positive}`;
  return `${part(lat, "N", "S")}, ${part(lng, "E", "W")}`;
}

async function fetchSite(id: number): Promise<Site> {
  const { data } = await api.GET("/api/v1/sites/{id}", { params: { path: { id } } });
  return data!;
}

/** The site page at `/sites/:id` (spec site/details). */
export function SitePage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const validId = /^\d+$/.test(id ?? "");
  const session = useSession();
  const viewerId = session.status === "signedIn" ? session.user.id : undefined;
  const site = useQuery({
    queryKey: ["sites", id, viewerId],
    queryFn: () => fetchSite(Number(id)),
    // Wait for the session, so an author reloading an unapproved site sends the token (design D5).
    enabled: validId && session.status !== "loading",
  });

  if (!validId || (site.error instanceof ApiError && site.error.status === 404)) {
    return (
      <div className={styles.page}>
        <h1 className="h1">{t("site.details.notFound")}</h1>
        <Link to="/">{t("site.details.backToMap")}</Link>
      </div>
    );
  }
  if (site.isError) {
    return (
      <div className={styles.page}>
        <Alert tone="danger" live>
          {t("site.details.loadError")}
        </Alert>
      </div>
    );
  }
  return <div className={styles.page}>{site.data && <SiteDetails site={site.data} />}</div>;
}

function SiteDetails({ site }: { site: Site }) {
  const { t } = useTranslation();
  const country = t(`geo.countries.${site.countryCode}`);
  const region = t(`geo.regions.${site.regionCode}`);
  return (
    <>
      <nav aria-label={t("site.details.breadcrumb")} className={`body-sm ${styles.breadcrumb}`}>
        <Link to="/">{t("site.details.map")}</Link>
        {` / ${country} / ${region} / ${site.name}`}
      </nav>
      {site.status === "PENDING" && <Alert tone="caution">{t("site.details.pendingNotice")}</Alert>}
      {site.status === "REJECTED" && (
        <Alert tone="danger" title={t("site.details.rejectedNotice")}>
          {site.rejectionReason}
        </Alert>
      )}
      <div className={styles.columns}>
        <div className={styles.content}>
          <div>
            <h1 className={`h1 ${styles.name}`}>{site.name}</h1>
            <span className={`data ${styles.muted}`}>
              {`${formatCoordinates(site.lat, site.lng)} · ${country}, ${region}`}
            </span>
          </div>
          <section className={styles.about}>
            <h2 className={`h2 ${styles.name}`}>{t("site.details.about")}</h2>
            <p className={`body ${styles.description}`}>{site.description}</p>
          </section>
        </div>
        <aside className={styles.aside}>
          <div className={styles.card} aria-label={t("site.details.facts")} role="group">
            <dl className={styles.facts}>
              <div>
                <dt className={`caption ${styles.muted}`}>{t("site.details.depth")}</dt>
                <dd className={`data ${styles.fact}`}>
                  {t("site.depthRange", { min: site.minDepth, max: site.maxDepth })}
                </dd>
              </div>
              <div>
                <dt className={`caption ${styles.muted}`}>{t("site.details.difficulty")}</dt>
                <dd className={styles.fact}>
                  <DifficultyBadge difficulty={site.difficulty} />
                </dd>
              </div>
            </dl>
            <GearList title={t("site.details.requiredGear")} codes={site.requiredGear} />
            <GearList title={t("site.details.recommendedGear")} codes={site.recommendedGear} />
          </div>
          <Alert tone="info">{t("shell.footer.disclaimer")}</Alert>
        </aside>
      </div>
    </>
  );
}

function GearList({ title, codes }: { title: string; codes: string[] }) {
  const { t } = useTranslation();
  if (codes.length === 0) return null;
  return (
    <div className={styles.gear}>
      <span className="label">{title}</span>
      <div className={styles.chips}>
        {codes.map((code) => (
          <Badge key={code}>{t(`gear.${code}`)}</Badge>
        ))}
      </div>
    </div>
  );
}
