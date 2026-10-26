import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import { api } from "../../api/client";
import { signOut, type SessionUser } from "../../api/session";
import { buttonClassName } from "../../components/Button/Button";
import styles from "./AccountArea.module.css";
import type { FromState } from "./redirect";
import { useSession } from "./useSession";

export type AccountPlacement = "header" | "drawer";

/** "MK" for "Mira Koval": the first letters of the first two words, in the user's locale. */
export function initials(displayName: string, locale?: string): string {
  return displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => [...word][0] ?? "")
    .join("")
    .toLocaleUpperCase(locale);
}

/** Logs out on the server, but signs out here even when that call fails (spec auth). */
async function logOut() {
  try {
    await api.POST("/api/v1/auth/logout");
  } catch {
    // The refresh cookie may outlive this, but the access token is gone from memory.
  } finally {
    signOut();
  }
}

/**
 * The header's account area (spec shared/app-shell): "Log in" and "Sign up" when signed out, the
 * initials button and its menu when signed in, nothing while the session is being restored.
 */
export function AccountArea({
  placement,
  onNavigate,
}: {
  placement: AccountPlacement;
  onNavigate?: () => void;
}) {
  const session = useSession();
  if (session.status === "loading") return null;
  if (session.status === "signedOut")
    return <SignedOutLinks placement={placement} onNavigate={onNavigate} />;
  return placement === "header" ? (
    <AccountMenu user={session.user} />
  ) : (
    <DrawerAccount user={session.user} onNavigate={onNavigate} />
  );
}

function SignedOutLinks({
  placement,
  onNavigate,
}: {
  placement: AccountPlacement;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  // After logging in, come back here, unless "here" is already an auth page.
  const state: FromState = { from: `${location.pathname}${location.search}` };
  return (
    <div className={placement === "header" ? styles.links : styles.drawerLinks}>
      <Link
        to="/login"
        state={state}
        className={`label ${styles.link}`}
        aria-current={location.pathname === "/login" ? "page" : undefined}
        onClick={onNavigate}
      >
        {t("shell.account.logIn")}
      </Link>
      <Link
        to="/register"
        state={state}
        className={buttonClassName({ size: "sm" })}
        onClick={onNavigate}
      >
        {t("shell.account.signUp")}
      </Link>
    </div>
  );
}

function AccountMenu({ user }: { user: SessionUser }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const firstItem = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) button.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    firstItem.current?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open, close]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && open) {
      event.stopPropagation();
      close(true);
    }
  };

  return (
    <div ref={root} className={styles.account} onKeyDown={onKeyDown}>
      <button
        ref={button}
        type="button"
        className={styles.avatar}
        aria-label={t("shell.account.menu", { name: user.displayName })}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">{initials(user.displayName, i18n.language)}</span>
      </button>
      {open && (
        <div id={menuId} role="menu" aria-label={user.displayName} className={styles.menu}>
          <p className={`label ${styles.name}`} role="presentation">
            {user.displayName}
          </p>
          <button
            ref={firstItem}
            type="button"
            role="menuitem"
            className={`label ${styles.item}`}
            onClick={() => {
              close(true);
              void logOut();
            }}
          >
            {t("shell.account.logOut")}
          </button>
        </div>
      )}
    </div>
  );
}

function DrawerAccount({ user, onNavigate }: { user: SessionUser; onNavigate?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className={styles.drawerLinks}>
      <p className={`label ${styles.drawerName}`}>{user.displayName}</p>
      <button
        type="button"
        className={`label ${styles.link}`}
        onClick={() => {
          void logOut();
          onNavigate?.();
        }}
      >
        {t("shell.account.logOut")}
      </button>
    </div>
  );
}
