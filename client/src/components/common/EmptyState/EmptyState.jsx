import { Gift } from 'lucide-react';
import styles from './EmptyState.module.css';

export function EmptyState({ title = 'No current giveaway', message, icon: Icon = Gift }) {
  return (
    <div className={styles.wrap}>
      <Icon size={26} className={styles.icon} aria-hidden="true" />
      <h3 className={styles.title}>{title}</h3>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
