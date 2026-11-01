import { useId, type Ref, type TextareaHTMLAttributes } from "react";
import styles from "./TextField.module.css";

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** Translated label. */
  label: string;
  hint?: string;
  /** Translated error; replaces the hint and marks the field invalid. */
  error?: string;
  ref?: Ref<HTMLTextAreaElement>;
};

/** TextField for longer text. */
export function TextAreaField({ label, hint, error, ref, ...textarea }: TextAreaFieldProps) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? hint;
  return (
    <div className={styles.field}>
      <label className={`label ${styles.label}`} htmlFor={id}>
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        rows={5}
        className={`body ${styles.input}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        {...textarea}
      />
      {note && (
        <span id={noteId} className={`body-sm ${error ? styles.error : styles.hint}`}>
          {note}
        </span>
      )}
    </div>
  );
}
