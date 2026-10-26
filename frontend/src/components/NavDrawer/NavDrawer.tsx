import { X } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import type { RenderAccount } from "../AppHeader/AppHeader";
import { NavLinks } from "../AppHeader/NavLinks";
import { LanguageSwitch } from "../LanguageSwitch/LanguageSwitch";
import styles from "./NavDrawer.module.css";

export const WIDE_SCREEN_QUERY = "(min-width: 768px)";
const FOCUSABLE = "a[href], button:not([disabled])";

/**
 * The narrow-screen menu: a modal dialog sliding in from the left over a scrim, holding the
 * navigation, the language switch and the account links. It closes on its close button, the scrim, Escape, a
 * followed link, and when the viewport widens past the breakpoint; the opener restores focus.
 * Not a native <dialog>: jsdom has no showModal(), so the behaviour could not be tested.
 */
export function NavDrawer({
  id,
  onClose,
  account,
}: {
  id: string;
  onClose: () => void;
  account?: RenderAccount;
}) {
  const { t } = useTranslation();
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => closeButton.current?.focus(), []);

  useEffect(() => {
    const wide = window.matchMedia(WIDE_SCREEN_QUERY);
    const closeWhenWide = () => {
      if (wide.matches) onClose();
    };
    closeWhenWide();
    wide.addEventListener("change", closeWhenWide);
    return () => wide.removeEventListener("change", closeWhenWide);
  }, [onClose]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !panel.current) return;
    // Keep focus inside the dialog.
    const focusable = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return createPortal(
    <div className={styles.root} onKeyDown={onKeyDown}>
      <div className={styles.scrim} aria-hidden="true" onClick={onClose} />
      <div
        ref={panel}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={t("shell.menu.label")}
        className={styles.panel}
      >
        <button
          ref={closeButton}
          type="button"
          className={styles.close}
          aria-label={t("shell.menu.close")}
          onClick={onClose}
        >
          <X size={20} aria-hidden="true" />
        </button>
        <nav aria-label={t("shell.nav.label")}>
          <NavLinks vertical onNavigate={onClose} />
        </nav>
        <LanguageSwitch className={styles.language} />
        {account?.("drawer", onClose)}
      </div>
    </div>,
    document.body,
  );
}
