import { useState, type MouseEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { Button } from "../../components/Button/Button";
import { Dialog, DialogActions, DialogBody } from "../../components/Dialog/Dialog";
import type { FromState } from "./redirect";
import { useSession } from "./useSession";

/** The actions that need a diver account (spec auth, "Diver actions ask a visitor to log in"). */
export type DiverAction = "logDive" | "review" | "warning" | "addSite";

/**
 * A link to a page that needs an account. For a signed-out visitor a plain click opens the
 * log-in prompt instead of navigating (design D6); a signed-in user, a session still loading
 * and a modified click get the plain link, and `RequireAuth` still guards the page itself.
 */
export function DiverActionLink({
  action,
  to,
  className,
  children,
}: {
  action: DiverAction;
  to: string;
  className?: string;
  children: ReactNode;
}) {
  const session = useSession();
  const [prompting, setPrompting] = useState(false);
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (session.status !== "signedOut") return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    setPrompting(true);
  };
  return (
    <>
      <Link className={className} to={to} onClick={onClick}>
        {children}
      </Link>
      {prompting && (
        <LoginPromptDialog action={action} to={to} onCancel={() => setPrompting(false)} />
      )}
    </>
  );
}

/** "Log in to continue": names the action, and Log in returns to `to` after logging in. */
export function LoginPromptDialog({
  action,
  to,
  onCancel,
}: {
  action: DiverAction;
  to: string;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const state: FromState = { from: to };
  return (
    <Dialog title={t("auth.loginPrompt.title")} onClose={onCancel} size="sm">
      <DialogBody>
        <p className="body">{t(`auth.loginPrompt.actions.${action}`)}</p>
      </DialogBody>
      <DialogActions>
        <Button variant="secondary" data-autofocus onClick={onCancel}>
          {t("auth.loginPrompt.cancel")}
        </Button>
        <Button onClick={() => void navigate("/login", { state })}>
          {t("auth.loginPrompt.login")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
