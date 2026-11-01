import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "../../components/Button/Button";
import { formatDiveDate, formatDiveNumber, type DiveEntry } from "./api";
import styles from "./DiveLog.module.css";

const DASH = "—";

/** The dive table of design/screens/DiveLog.html; `onEdit` adds the row action. */
export function DiveTable({
  entries,
  onEdit,
}: {
  entries: DiveEntry[];
  onEdit?: (entry: DiveEntry) => void;
}) {
  const { t, i18n } = useTranslation();
  const value = (number: number | undefined | null, unit: string) =>
    number == null
      ? DASH
      : `${formatDiveNumber(number, i18n.language)} ${t(`divelog.units.${unit}`)}`;
  return (
    <div className={styles.tableBox}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className="label">{t("divelog.table.date")}</th>
            <th className="label">{t("divelog.table.site")}</th>
            <th className="label">{t("divelog.table.maxDepth")}</th>
            <th className="label">{t("divelog.table.water")}</th>
            <th className="label">{t("divelog.table.visibility")}</th>
            {onEdit && <th className={styles.hidden}>{t("divelog.table.actions")}</th>}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="body-sm">{formatDiveDate(entry.date, i18n.language)}</td>
              <td>
                <Link className="label" to={`/sites/${entry.siteId}`}>
                  {entry.siteName}
                </Link>
                <div className={`body-sm ${styles.muted}`}>
                  {`${t(`geo.countries.${entry.countryCode}`)} · ${t(`geo.regions.${entry.regionCode}`)}`}
                </div>
              </td>
              <td className="data">{value(entry.maxDepth, "m")}</td>
              <td className="data">{value(entry.waterTemperature, "celsius")}</td>
              <td className="data">{value(entry.visibility, "m")}</td>
              {onEdit && (
                <td className={styles.actionCell}>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t("divelog.table.editEntry", { site: entry.siteName })}
                    onClick={() => onEdit(entry)}
                  >
                    {t("divelog.table.edit")}
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
