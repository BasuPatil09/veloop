import styles from './Button.module.css';

/**
 * isLoading disables the button AND shows a spinner — the single mechanism used
 * everywhere a request is in flight (auth forms now; join/claim in later phases)
 * so duplicate submissions are structurally prevented, not just discouraged.
 */
export function Button({ variant = 'primary', isLoading = false, loadingText, children, disabled, ...props }) {
  return (
    <button
      type="button"
      className={`${styles.button} ${styles[variant]}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <span className={styles.spinner} aria-hidden="true" />}
      {isLoading ? loadingText || children : children}
    </button>
  );
}
