import { useId, type Ref, type TextareaHTMLAttributes } from "react";
import styles from "./TextField.module.css";

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** Translated label. */
  label: string;
  /** Translated error; marks the field invalid. */
  error?: string;
  ref?: Ref<HTMLTextAreaElement>;
};

/** TextField for longer text. */
export function TextAreaField({ label, error, ref, ...textarea }: TextAreaFieldProps) {
  const id = useId();
  const noteId = `${id}-note`;
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
        aria-describedby={error ? noteId : undefined}
        {...textarea}
      />
      {error && (
        <span id={noteId} className={`body-sm ${styles.error}`}>
          {error}
        </span>
      )}
    </div>
  );
}
