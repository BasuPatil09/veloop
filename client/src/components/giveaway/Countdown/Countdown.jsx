import { useEffect, useRef } from 'react';
import { useCountdown } from '../../../hooks/useCountdown';
import styles from './Countdown.module.css';

function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * onComplete fires once when the countdown reaches zero — callers should use it
 * to re-fetch from the backend, not to flip local state to "ended" themselves.
 */
export function Countdown({ targetDate, onComplete, size = 'md' }) {
  const { days, hours, minutes, seconds, isComplete } = useCountdown(targetDate);
  const firedRef = useRef(false);

  useEffect(() => {
    if (isComplete && !firedRef.current) {
      firedRef.current = true;
      onComplete?.();
    }
  }, [isComplete, onComplete]);

  if (!targetDate) return null;

  return (
    <div className={`${styles.countdown} ${size === 'sm' ? styles.sm : ''}`} role="timer" aria-label="Time remaining">
      <div className={styles.segment}>
        <span className={styles.value}>{pad(days)}</span>
        <span className={styles.label}>d</span>
      </div>
      <span className={styles.colon}>:</span>
      <div className={styles.segment}>
        <span className={styles.value}>{pad(hours)}</span>
        <span className={styles.label}>h</span>
      </div>
      <span className={styles.colon}>:</span>
      <div className={styles.segment}>
        <span className={styles.value}>{pad(minutes)}</span>
        <span className={styles.label}>m</span>
      </div>
      <span className={styles.colon}>:</span>
      <div className={styles.segment}>
        <span className={styles.value}>{pad(seconds)}</span>
        <span className={styles.label}>s</span>
      </div>
    </div>
  );
}
