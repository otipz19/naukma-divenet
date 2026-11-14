import { useState, type InputHTMLAttributes, type Ref } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TextField } from "../TextField/TextField";
import styles from "./PasswordField.module.css";

type PasswordFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Translated label; never replaced by a placeholder. */
  label: string;
  hint?: string;
  /** Translated error; replaces the hint and marks the input invalid. */
  error?: string;
  ref?: Ref<HTMLInputElement>;
};

/** TextField plus an accessible unmask toggle: a button with aria-pressed, per
 * the forms guide (identity and payments section). The type stays "password"
 * or becomes "text" only while revealed; pasting is never blocked. */
export function PasswordField({ label, hint, error, ref, ...input }: PasswordFieldProps) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(false);
  return (
    <div className={styles.field}>
      <TextField
        label={label}
        hint={hint}
        error={error}
        ref={ref}
        type={revealed ? "text" : "password"}
        {...input}
      />
      <button
        type="button"
        className={styles.toggle}
        aria-pressed={revealed}
        onClick={() => setRevealed((value) => !value)}
      >
        {revealed ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
        <span>{revealed ? t("auth.hidePassword") : t("auth.showPassword")}</span>
      </button>
    </div>
  );
}
