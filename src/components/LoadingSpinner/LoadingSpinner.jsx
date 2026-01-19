import styles from "./LoadingSpinner.module.css";

export default function LoadingSpinner({ message = "טוען..." }) {
  return (
    <div className={styles.spinnerContainer}>
      <div className={styles.spinner}></div>
      <p className={styles.loadingText}>{message}</p>
    </div>
  );
}
