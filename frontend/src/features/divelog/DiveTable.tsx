import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "../../components/Button/Button";
import { formatDiveDate, formatDiveNumber, type DiveEntry } from "./api";
import styles from "./DiveLog.module.css";

const DASH = "—";

/** The dive table of design/screens/DiveLog.html; `onEdit` and `onDelete` add the row actions. */
export function DiveTable({
  entries,
  onEdit,
  onDelete,
}: {
  entries: DiveEntry[];
  onEdit?: (entry: DiveEntry) => void;
  onDelete?: (entry: DiveEntry) => void;
}) {
  const { t, i18n } = useTranslation();
  const value = (number: number | undefined | null, unit: string) =>
    number == null
      ? DASH
      : `${formatDiveNumber(number, i18n.language)} ${t(`divelog.units.${unit}`)}`;
  const named = (entry: DiveEntry) => ({
    site: entry.siteName,
    date: formatDiveDate(entry.date, i18n.language),
  });
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
            {/* The cell stays in the row so the header background spans the actions column. */}
            {onEdit && (
              <th>
                <span className={styles.hidden}>{t("divelog.table.actions")}</span>
              </th>
            )}
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
                    aria-label={t("divelog.table.editEntry", named(entry))}
                    onClick={() => onEdit(entry)}
                  >
                    {t("divelog.table.edit")}
                  </Button>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={t("divelog.table.deleteEntry", named(entry))}
                      onClick={() => onDelete(entry)}
                    >
                      {t("divelog.table.delete")}
                    </Button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
