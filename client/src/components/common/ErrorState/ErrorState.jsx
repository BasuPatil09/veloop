import { AlertTriangle } from 'lucide-react';
import { Button } from '../Button/Button';
import styles from './ErrorState.module.css';

export function ErrorState({ title = 'Unable to load giveaway', message, onRetry }) {
  return (
    <div className={styles.wrap} role="alert">
      <AlertTriangle size={26} className={styles.icon} aria-hidden="true" />
      <h3 className={styles.title}>{title}</h3>
      {message && <p className={styles.message}>{message}</p>}
      {onRetry && (
        <Button variant="secondary" fullWidth={false} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
