import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/Button/Button";
import { Dialog, DialogActions, DialogBody } from "../../components/Dialog/Dialog";
import { readDismissed, saveDismissed } from "./disclaimerStorage";
import styles from "./DisclaimerDialog.module.css";

/**
 * The safety disclaimer on a first visit (spec shared/disclaimer, design D1). It opens once per
 * page load unless "Don't show again" was saved in this browser; the shell stays mounted across
 * routes, so following a link never opens it again.
 */
export function DisclaimerDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(() => !readDismissed());
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const wasOpen = useRef(open);

  // The dialog opened on load, so there is no opener to return to: focus goes to the page content.
  // It runs after the dialog is gone, since the page behind a modal dialog cannot take focus.
  useEffect(() => {
    if (wasOpen.current && !open) document.getElementById("main")?.focus();
    wasOpen.current = open;
  }, [open]);

  if (!open) return null;

  const close = () => {
    if (dontShowAgain) saveDismissed();
    setOpen(false);
  };

  return (
    <Dialog title={t("shell.disclaimer.title")} onClose={close} size="sm">
      <DialogBody>
        <p className={`body ${styles.flush}`}>
          <strong>{t("shell.disclaimer.safetyLead")}</strong> {t("shell.disclaimer.disclaimer")}
        </p>
        <p className={`caption ${styles.muted}`}>{t("shell.disclaimer.project")}</p>
        <label className={`body-sm ${styles.check}`}>
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(event) => setDontShowAgain(event.target.checked)}
          />
          {t("shell.disclaimer.dontShowAgain")}
        </label>
      </DialogBody>
      <DialogActions>
        <Button data-autofocus onClick={close}>
          {t("shell.disclaimer.gotIt")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
