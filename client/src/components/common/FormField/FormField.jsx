import { useId } from 'react';
import styles from './FormField.module.css';

export function FormField({ label, error, hint, type = 'text', ...inputProps }) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={styles.group}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        className={styles.input}
        aria-invalid={Boolean(error)}
        aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
        {...inputProps}
      />
      {hint && !error && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.errorText} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
