import { useEffect, useState } from 'react';
import { LoopMark } from '../LoopMark';
import styles from './VeloopLoader.module.css';

const DEFAULT_MESSAGES = [
  "Preparing today's rewards...",
  'Checking active giveaways...',
  'Loading available prizes...',
  'Bringing your rewards closer...',
];

/**
 * The one loader used across the app instead of a generic Bootstrap spinner
 * (spec requirement — the loader should feel like part of the giveaway experience).
 * Pass a single `message` for a fixed-state loader (e.g. "Checking your session..."),
 * or omit it to cycle through `messages` slowly.
 */
export function VeloopLoader({ message, messages = DEFAULT_MESSAGES, rotateMs = 2200 }) {
  const [index, setIndex] = useState(0);
  const isRotating = !message && messages.length > 1;

  useEffect(() => {
    if (!isRotating) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % messages.length), rotateMs);
    return () => clearInterval(id);
  }, [isRotating, messages.length, rotateMs]);

  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <div className={styles.markWrap}>
        <span className={styles.ring} aria-hidden="true" />
        <LoopMark size={26} color="var(--veloop-primary)" />
      </div>
      <p className={styles.message}>{message || messages[index]}</p>
    </div>
  );
}
