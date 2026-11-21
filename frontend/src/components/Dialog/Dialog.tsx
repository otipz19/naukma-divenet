import { X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormHTMLAttributes,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../Button/Button";
import styles from "./Dialog.module.css";

const RequestClose = createContext<() => void>(() => {});

/** Asks the enclosing dialog to close, through its unsaved-changes question (for a Cancel button). */
export function useDialogClose() {
  return useContext(RequestClose);
}

/**
 * design/system/components/Dialog (spec shared/dialogs). A native `<dialog>` opened with
 * `showModal()` while it is rendered: the consumer opens it by rendering it and closes it in
 * `onClose`. Escape, the close button and `useDialogClose()` ask first when `dirty` is set.
 * Focus starts on the `[data-autofocus]` element, else on the first control in the body, and
 * returns to the control that opened the dialog.
 */
export function Dialog({
  title,
  onClose,
  dirty = false,
  size = "md",
  closeButton = true,
  children,
}: {
  title: ReactNode;
  onClose: () => void;
  /** The form inside has unsaved changes: closing asks "Discard changes?" first (design D3). */
  dirty?: boolean;
  size?: "md" | "sm";
  closeButton?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [asking, setAsking] = useState(false);
  const dirtyRef = useRef(dirty);
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    dirtyRef.current = dirty;
    onCloseRef.current = onClose;
  });

  const requestClose = useCallback(() => {
    if (dirtyRef.current) setAsking(true);
    else onCloseRef.current();
  }, []);

  useLayoutEffect(() => {
    const dialog = ref.current!;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    let unmounting = false;
    if (!dialog.open) dialog.showModal();
    const first =
      dialog.querySelector<HTMLElement>("[data-autofocus]") ??
      dialog.querySelector<HTMLElement>(
        `.${styles.body} :is(input, select, textarea, button:not([disabled]))`,
      );
    first?.focus();
    // A browser may still close the dialog after a vetoed Escape (close watcher rules): reopen it
    // and ask, or treat it as a close.
    const onNativeClose = () => {
      if (unmounting) return;
      if (dirtyRef.current) {
        dialog.showModal();
        setAsking(true);
      } else {
        onCloseRef.current();
      }
    };
    dialog.addEventListener("close", onNativeClose);
    return () => {
      unmounting = true;
      dialog.removeEventListener("close", onNativeClose);
      const focusInside = dialog.contains(document.activeElement);
      const focusLost = document.activeElement === document.body || !document.activeElement;
      dialog.close();
      // Only when focus is still ours: an outer dialog closing first has already moved it.
      if (!(focusInside || focusLost) || !opener) return;
      if (opener.isConnected) opener.focus();
      // When nested dialogs close together, the browser moves focus while they are removed: once the
      // commit is done, a focus left on the body goes to an opener that is still in the page.
      queueMicrotask(() => {
        const lost = !document.activeElement || document.activeElement === document.body;
        if (lost && opener.isConnected) opener.focus();
      });
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${size === "sm" ? styles.sm : ""}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Escape: this dialog decides, and an enclosing dialog does not see it.
        event.preventDefault();
        event.stopPropagation();
        requestClose();
      }}
    >
      <div className={styles.head}>
        <h2 id={titleId} className={`h3 ${styles.title}`}>
          {title}
        </h2>
        {closeButton && (
          <button
            type="button"
            className={styles.close}
            aria-label={t("common.dialog.close")}
            onClick={requestClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}
      </div>
      <RequestClose.Provider value={requestClose}>{children}</RequestClose.Provider>
      {asking && (
        <ConfirmDialog
          question={t("common.dialog.discardQuestion")}
          confirmLabel={t("common.dialog.discard")}
          cancelLabel={t("common.dialog.keepEditing")}
          onConfirm={() => {
            setAsking(false);
            onCloseRef.current();
          }}
          onCancel={() => setAsking(false)}
        />
      )}
    </dialog>
  );
}

/** The dialog's scrolling middle. */
export function DialogBody({ children }: { children: ReactNode }) {
  return <div className={styles.body}>{children}</div>;
}

/** The dialog's actions row: secondary actions first, the primary one last. */
export function DialogActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>;
}

/** Cancel in a dialog's actions: it closes the dialog through the unsaved-changes question. */
export function DialogCancel({ children }: { children: ReactNode }) {
  const close = useDialogClose();
  return (
    <Button variant="secondary" onClick={close}>
      {children}
    </Button>
  );
}

/** A form that holds a dialog's body and actions, so the submit button sits in the actions row. */
export function DialogForm({ className, ...props }: FormHTMLAttributes<HTMLFormElement>) {
  return <form className={[styles.form, className].filter(Boolean).join(" ")} {...props} />;
}

/**
 * A confirmation before a destructive action (spec shared/dialogs, design D4). The question is
 * the dialog's name; focus starts on Cancel, so Enter never confirms by accident.
 */
export function ConfirmDialog({
  question,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  onConfirm,
  onCancel,
}: {
  question: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog title={question} onClose={onCancel} size="sm" closeButton={false}>
      <DialogActions>
        <Button variant="secondary" data-autofocus onClick={onCancel}>
          {cancelLabel ?? t("common.dialog.cancel")}
        </Button>
        <Button variant={tone} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
