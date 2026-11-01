import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Alert } from "../../components/Alert/Alert";
import { buttonClassName } from "../../components/Button/Button";
import { certificateTitle, CertificateStatusBadge, useCertificates } from "./certificates";
import styles from "./Certificates.module.css";

/** The certificates of design/screens/Profile.html; hidden ones are not requested. */
export function ProfileCertificates({
  userId,
  own,
  admin,
  showCertificates,
}: {
  userId: number;
  own: boolean;
  admin: boolean;
  showCertificates: boolean;
}) {
  const { t } = useTranslation();
  const canSee = own || admin || showCertificates;
  const certificates = useCertificates(userId, canSee);
  const items = certificates.data ?? [];

  if (!canSee) {
    return <span className={`body-sm ${styles.muted}`}>{t("user.certificates.hidden")}</span>;
  }
  if (certificates.isError) {
    return (
      <Alert tone="danger" live>
        {t("user.certificates.loadError")}
      </Alert>
    );
  }
  if (items.length === 0 && !own) return null;
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={`h2 ${styles.flush}`}>{t("user.certificates.title")}</h2>
        {own && (
          <Link
            className={buttonClassName({ variant: "ghost", size: "sm" })}
            to="/profile/certificates"
          >
            {t("user.certificates.manage")}
          </Link>
        )}
      </div>
      {items.length === 0 && (
        <span className={`body ${styles.muted}`}>{t("user.certificates.none")}</span>
      )}
      <div className={styles.cards}>
        {items.map((certificate) => (
          <div key={certificate.id} className={styles.card}>
            <span className="label">{certificateTitle(certificate)}</span>
            <span>
              <CertificateStatusBadge status={certificate.status} />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
