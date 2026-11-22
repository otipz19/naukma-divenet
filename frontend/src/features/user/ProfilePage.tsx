import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { ApiError } from "../../api/ApiError";
import { useDocumentTitle } from "../../app/documentTitle";
import { Alert } from "../../components/Alert/Alert";
import { Avatar } from "../../components/Avatar/Avatar";
import { buttonClassName } from "../../components/Button/Button";
import { CardRows, PagePlaceholder, Skeleton } from "../../components/Skeleton/Skeleton";
import { initials } from "../auth/AccountArea";
import { NotFoundPage } from "../../app/routes/NotFoundPage";
import { useIsAdmin, useSession } from "../auth/useSession";
import { ProfileAchievements } from "../achievement/ProfileAchievements";
import { ProfileDives, ProfileStats } from "../divelog/ProfileDives";
import { ProfilePosts } from "../post/ProfilePosts";
import { useProfile } from "./api";
import { ProfileCertificates } from "./ProfileCertificates";
import { ProfileGear } from "./ProfileGear";
import styles from "./ProfilePage.module.css";

/** The header of design/screens/Profile.html; later changes add their sections (spec user/profile). */
export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const validId = /^\d+$/.test(id ?? "");
  const session = useSession();
  const isAdmin = useIsAdmin();
  // The admin is a moderator only and has no profile in the web app (spec auth, design D3). The
  // query waits for the session, so the admin's own profile is never requested.
  const ownAdminProfile =
    isAdmin && session.status === "signedIn" && session.user.id === Number(id);
  const profile = useProfile(
    Number(id),
    validId && session.status !== "loading" && !ownAdminProfile,
  );
  useDocumentTitle(profile.data?.displayName ?? t("shell.pageTitle.profile"));

  if (ownAdminProfile) return <NotFoundPage />;
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
  if (!profile.data) {
    return (
      <div className={styles.page}>
        <PagePlaceholder>
          <div className={styles.header}>
            <Skeleton round width="var(--space-8)" height="var(--space-8)" />
            <div className={styles.text}>
              <Skeleton width="40%" height="var(--space-6)" />
              <Skeleton width="70%" />
            </div>
          </div>
          <CardRows count={3} />
        </PagePlaceholder>
      </div>
    );
  }

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
        {session.status !== "loading" && (
          <ProfileStats
            userId={profile.data.id}
            own={own}
            showStatistics={profile.data.showStatistics}
          />
        )}
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
          admin={isAdmin}
          showCertificates={profile.data.showCertificates}
        />
      )}
      {session.status !== "loading" && <ProfileGear userId={profile.data.id} own={own} />}
      {session.status !== "loading" && <ProfileAchievements userId={profile.data.id} />}
      {session.status !== "loading" && (
        <ProfileDives userId={profile.data.id} own={own} showDiveLog={profile.data.showDiveLog} />
      )}
      {session.status !== "loading" && <ProfilePosts userId={profile.data.id} own={own} />}
    </div>
  );
}
