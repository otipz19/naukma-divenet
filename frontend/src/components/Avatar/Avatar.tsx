import styles from "./Avatar.module.css";

/**
 * design/system dn-avatar: an image, or initials when there is none. Decorative, because the name is
 * always beside it.
 */
export function Avatar({
  initials,
  src,
  size = "md",
}: {
  initials: string;
  src?: string | null;
  size?: "md" | "lg";
}) {
  const classes = `${size === "lg" ? `h2 ${styles.lg}` : `label ${styles.md}`} ${styles.avatar}`;
  if (src) return <img className={classes} src={src} alt="" />;
  return (
    <span className={classes} aria-hidden="true">
      {initials}
    </span>
  );
}
