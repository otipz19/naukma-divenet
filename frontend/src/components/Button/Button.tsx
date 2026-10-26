import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "sm";

/** The classes of a button, also for a link that is the primary call to action ("Sign up"). */
export function buttonClassName({
  variant = "primary",
  size = "md",
}: { variant?: ButtonVariant; size?: ButtonSize } = {}) {
  return ["label", styles.button, styles[variant], size === "sm" ? styles.sm : ""]
    .filter(Boolean)
    .join(" ");
}

/** design/system/components/Button. Defaults to `type="button"`, so it never submits by accident. */
export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  const classes = [buttonClassName({ variant, size }), className].filter(Boolean).join(" ");
  return <button type={type} className={classes} {...props} />;
}
