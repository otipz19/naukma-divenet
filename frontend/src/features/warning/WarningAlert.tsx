import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Alert, type AlertTone } from "../../components/Alert/Alert";
import { Button, buttonClassName } from "../../components/Button/Button";
import type { Warning, WarningType } from "./api";
import { formatRelativeDate } from "./relativeDate";
import styles from "./SiteWarnings.module.css";

const TONES: Record<WarningType, AlertTone> = {
  HAZARD: "danger",
  INCIDENT: "danger",
  CHANGED_CONDITIONS: "caution",
  MARINE_LIFE: "caution",
};

/** One warning alert on the site page (design D6). */
export function WarningAlert({
  warning,
  own,
  isAdmin,
  deleting,
  hiding,
  onDelete,
  onHide,
}: {
  warning: Warning;
  own: boolean;
  isAdmin: boolean;
  deleting: boolean;
  hiding: boolean;
  onDelete: () => void;
  onHide: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [confirming, setConfirming] = useState<"delete" | "hide" | null>(null);
  const typeLabel = t(`warning.types.${warning.type}`);
  const timeLabel = formatRelativeDate(warning.createdAt, i18n.language);
  const title = (
    <>
      {`${typeLabel} · ${timeLabel} · `}
      <Link to={`/users/${warning.author.id}`}>{warning.author.displayName}</Link>
    </>
  );

  const actions =
    confirming === "delete" ? (
      <div className={styles.actions} role="group" aria-label={t("warning.deleteConfirm")}>
        <span className="body-sm">{t("warning.deleteConfirm")}</span>
        <Button
          variant="danger"
          size="sm"
          disabled={deleting}
          onClick={() => {
            setConfirming(null);
            onDelete();
          }}
        >
          {t("warning.confirmDeleteYes")}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(null)}>
          {t("warning.cancel")}
        </Button>
      </div>
    ) : confirming === "hide" ? (
      <div className={styles.actions} role="group" aria-label={t("warning.hideConfirm")}>
        <span className="body-sm">{t("warning.hideConfirm")}</span>
        <Button
          variant="danger"
          size="sm"
          disabled={hiding}
          onClick={() => {
            setConfirming(null);
            onHide();
          }}
        >
          {t("warning.confirmHideYes")}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(null)}>
          {t("warning.cancel")}
        </Button>
      </div>
    ) : own || isAdmin ? (
      <div className={styles.actions}>
        {own && (
          <>
            <Link
              className={buttonClassName({ variant: "ghost", size: "sm" })}
              to={`/sites/${warning.siteId}/warnings/${warning.id}/edit`}
            >
              {t("warning.edit")}
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className={styles.danger}
              onClick={() => setConfirming("delete")}
            >
              {t("warning.delete")}
            </Button>
          </>
        )}
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            className={styles.danger}
            onClick={() => setConfirming("hide")}
          >
            {t("warning.hide")}
          </Button>
        )}
      </div>
    ) : undefined;

  return (
    <Alert tone={TONES[warning.type]} title={title} actions={actions}>
      <p className={styles.text}>{warning.text}</p>
    </Alert>
  );
}
