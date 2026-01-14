import styles from "./TopButton.module.css";

export default function TopButton({
  label,
  active,
  onClick,
  badge,
  badgeVariant, // "alert" | "info"
}) {
  if (!badge || badge <= 0) {
    return (
      <button
        className={`${styles.topButton} ${active ? styles.active : ""}`}
        onClick={onClick}
      >
        {label}
      </button>
    );
  }

  const badgeClass =
    badgeVariant === "info"
      ? styles.badgeGreen
      : styles.badgeRed; // default

  return (
    <button
      className={`${styles.topButton} ${active ? styles.active : ""}`}
      onClick={onClick}
    >
      {label}
      <span className={`${styles.badge} ${badgeClass}`}>
        {badge}
      </span>
    </button>
  );
}
