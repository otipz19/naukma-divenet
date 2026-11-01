import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type { components } from "../../api/schema.gen";
import { DifficultyBadge } from "../Badge/DifficultyBadge";
import { Rating } from "../Rating/Rating";
import styles from "./SiteCard.module.css";

/** design/system/components/SiteCard. The whole card is one link. */
export function SiteCard({
  site,
  selected = false,
}: {
  site: components["schemas"]["SiteMarkerResponse"];
  /** The site whose marker is open on the map. */
  selected?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Link
      className={`${styles.card} ${selected ? styles.selected : ""}`}
      to={`/sites/${site.id}`}
      aria-current={selected || undefined}
    >
      <h3 className={`h3 ${styles.title}`}>{site.name}</h3>
      <span className={`body-sm ${styles.place}`}>
        {`${t(`geo.countries.${site.countryCode}`)} · ${t(`geo.regions.${site.regionCode}`)}`}
      </span>
      <span className={`data ${styles.facts}`}>
        <Rating value={site.averageRating} count={site.ratingCount} />
        <DifficultyBadge difficulty={site.difficulty} />
        <span>{t("site.depthRange", { min: site.minDepth, max: site.maxDepth })}</span>
      </span>
    </Link>
  );
}
