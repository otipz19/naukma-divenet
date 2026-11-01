import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "../../api/client";
import type { components } from "../../api/schema.gen";
import { Badge, type BadgeTone } from "../../components/Badge/Badge";

export type Certificate = components["schemas"]["CertificateResponse"];
export type CertificateStatus = Certificate["status"];

/** "PADI Open Water"; an `OTHER` agency shows the level alone, as the review badge does. */
export function certificateTitle(certificate: Pick<Certificate, "agency" | "level">): string {
  return certificate.agency === "OTHER"
    ? certificate.level
    : `${certificate.agency} ${certificate.level}`;
}

/** Enabled only when the viewer may see them: hidden certificates are not even requested. */
export function useCertificates(userId: number, enabled = true) {
  return useQuery({
    queryKey: ["certificates", userId],
    queryFn: async () =>
      (await api.GET("/api/v1/users/{id}/certificates", { params: { path: { id: userId } } }))
        .data ?? [],
    enabled,
  });
}

const TONES: Record<CertificateStatus, BadgeTone> = {
  VERIFIED: "success",
  PENDING: "caution",
  REJECTED: "danger",
};

export function CertificateStatusBadge({ status }: { status: CertificateStatus }) {
  const { t } = useTranslation();
  return <Badge tone={TONES[status]}>{t(`user.certificates.status.${status}`)}</Badge>;
}
