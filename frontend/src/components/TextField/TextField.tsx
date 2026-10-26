import { useId, type InputHTMLAttributes, type Ref } from "react";
import styles from "./TextField.module.css";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Translated label; never replaced by a placeholder. */
  label: string;
  hint?: string;
  /** Translated error; replaces the hint and marks the input invalid. */
  error?: string;
  ref?: Ref<HTMLInputElement>;
};

/** design/system/components/TextField: label above, hint or error below, linked by aria-describedby. */
export function TextField({ label, hint, error, id, ref, ...input }: TextFieldProps) {
  const generated = useId();
  const inputId = id ?? generated;
  const noteId = `${inputId}-note`;
  const note = error ?? hint;
  return (
    <div className={styles.field}>
      <label className={`label ${styles.label}`} htmlFor={inputId}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={`body ${styles.input}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        {...input}
      />
      {note && (
        <span id={noteId} className={`body-sm ${error ? styles.error : styles.hint}`}>
          {note}
        </span>
      )}
    </div>
  );
}
