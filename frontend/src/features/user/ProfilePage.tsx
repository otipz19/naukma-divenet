import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { ApiError } from "../../api/ApiError";
import { Alert } from "../../components/Alert/Alert";
import { Avatar } from "../../components/Avatar/Avatar";
import { buttonClassName } from "../../components/Button/Button";
import { initials } from "../auth/AccountArea";
import { useSession } from "../auth/useSession";
import { ProfileAchievements } from "../achievement/ProfileAchievements";
import { ProfileDives } from "../divelog/ProfileDives";
import { ProfilePosts } from "../post/ProfilePosts";
import { useProfile } from "./api";
import { ProfileCertificates } from "./ProfileCertificates";
import styles from "./ProfilePage.module.css";

/** The header of design/screens/Profile.html; later changes add their sections (spec user/profile). */
export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const validId = /^\d+$/.test(id ?? "");
  const session = useSession();
  const profile = useProfile(Number(id), validId);

  if (!validId || (profile.error instanceof ApiError && profile.error.status === 404)) {
    return (
      <div className={styles.page}>
        <h1 className="h1">{t("user.profile.notFound")}</h1>
        <Link to="/">{t("user.profile.backToMap")}</Link>
      </div>
    );
  }
  if (profile.isError) {
    return (
      <div className={styles.page}>
        <Alert tone="danger" live>
          {t("user.profile.loadError")}
        </Alert>
      </div>
    );
  }
  if (!profile.data) return null;

  const { displayName, bio, avatar } = profile.data;
  const own = session.status === "signedIn" && session.user.id === profile.data.id;
  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <Avatar size="lg" initials={initials(displayName, i18n.language)} src={avatar?.url} />
        <div className={styles.text}>
          <h1 className={`display ${styles.flush}`}>{displayName}</h1>
          {bio && <p className={`body ${styles.bio}`}>{bio}</p>}
        </div>
        {own && (
          <Link className={buttonClassName({ variant: "secondary" })} to="/profile/edit">
            {t("user.profile.edit")}
          </Link>
        )}
      </section>
      {/* Waits for the session, so an owner reloading is not treated as a stranger (design D6). */}
      {session.status !== "loading" && (
        <ProfileCertificates
          userId={profile.data.id}
          own={own}
          admin={session.status === "signedIn" && session.user.role === "ADMIN"}
          showCertificates={profile.data.showCertificates}
        />
      )}
      {session.status !== "loading" && <ProfileAchievements userId={profile.data.id} />}
      {session.status !== "loading" && (
        <ProfileDives
          userId={profile.data.id}
          own={own}
          showDiveLog={profile.data.showDiveLog}
          showStatistics={profile.data.showStatistics}
        />
      )}
      {session.status !== "loading" && <ProfilePosts userId={profile.data.id} own={own} />}
    </div>
  );
}
