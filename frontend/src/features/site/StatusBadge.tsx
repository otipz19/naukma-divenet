import { useTranslation } from "react-i18next";
import { Badge, type BadgeTone } from "../../components/Badge/Badge";

export type SiteStatus = "PENDING" | "APPROVED" | "REJECTED";

const TONES: Record<SiteStatus, BadgeTone> = {
  PENDING: "caution",
  APPROVED: "success",
  REJECTED: "danger",
};

/** A moderation status as a word, with the tones of the Badge README. */
export function StatusBadge({ status }: { status: SiteStatus }) {
  const { t } = useTranslation();
  return <Badge tone={TONES[status]}>{t(`site.status.${status}`)}</Badge>;
}
