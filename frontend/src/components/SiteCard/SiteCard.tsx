import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type { components } from "../../api/schema.gen";
import { DifficultyBadge } from "../Badge/DifficultyBadge";
import styles from "./SiteCard.module.css";

/** design/system/components/SiteCard, without Rating until add-site-reviews. The whole card is one link. */
export function SiteCard({ site }: { site: components["schemas"]["SiteMarkerResponse"] }) {
  const { t } = useTranslation();
  return (
    <Link className={styles.card} to={`/sites/${site.id}`}>
      <h3 className={`h3 ${styles.title}`}>{site.name}</h3>
      <span className={`body-sm ${styles.place}`}>
        {`${t(`geo.countries.${site.countryCode}`)} · ${t(`geo.regions.${site.regionCode}`)}`}
      </span>
      <span className={`data ${styles.facts}`}>
        <DifficultyBadge difficulty={site.difficulty} />
        <span>{t("site.depthRange", { min: site.minDepth, max: site.maxDepth })}</span>
      </span>
    </Link>
  );
}
