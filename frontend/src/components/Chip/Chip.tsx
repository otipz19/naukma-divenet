import { Check } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./Chip.module.css";

/** design/system/components/Chip. The check icon shows the state without relying on colour. */
export function Chip({
  pressed,
  onToggle,
  children,
}: {
  pressed: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`label ${styles.chip}`}
      aria-pressed={pressed}
      onClick={onToggle}
    >
      {pressed && <Check size={16} aria-hidden="true" />}
      {children}
    </button>
  );
}
