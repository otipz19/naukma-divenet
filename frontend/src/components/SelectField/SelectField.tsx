import { useId, type Ref, type SelectHTMLAttributes } from "react";
import styles from "../TextField/TextField.module.css";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  /** Translated label. */
  label: string;
  /** Translated error; marks the select invalid. */
  error?: string;
  ref?: Ref<HTMLSelectElement>;
};

/** A `select.dn-input` with its label above, styled as TextField. */
export function SelectField({ label, error, children, ref, ...select }: SelectFieldProps) {
  const id = useId();
  const noteId = `${id}-note`;
  return (
    <div className={styles.field}>
      <label className={`label ${styles.label}`} htmlFor={id}>
        {label}
      </label>
      <select
        ref={ref}
        id={id}
        className={`body ${styles.input}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? noteId : undefined}
        {...select}
      >
        {children}
      </select>
      {error && (
        <span id={noteId} className={`body-sm ${styles.error}`}>
          {error}
        </span>
      )}
    </div>
  );
}
