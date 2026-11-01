import { useId, type SelectHTMLAttributes } from "react";
import styles from "../TextField/TextField.module.css";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  /** Translated label. */
  label: string;
};

/** A `select.dn-input` with its label above, styled as TextField. */
export function SelectField({ label, children, ...select }: SelectFieldProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label className={`label ${styles.label}`} htmlFor={id}>
        {label}
      </label>
      <select id={id} className={`body ${styles.input}`} {...select}>
        {children}
      </select>
    </div>
  );
}
