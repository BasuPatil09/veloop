import { Trophy } from 'lucide-react';
import styles from './WinnerCard.module.css';

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function WinnerCard({ winner, showGiveawayName = false }) {
  return (
    <div className={styles.card}>
      <div className={styles.iconWrap}>
        <Trophy size={16} aria-hidden="true" />
      </div>
      <div className={styles.body}>
        <p className={styles.maskedId}>{winner.maskedUserId}</p>
        <p className={styles.prizeName}>{winner.prizeName}</p>
        {showGiveawayName && <p className={styles.giveawayName}>{winner.giveawayTitle}</p>}
        <p className={styles.date}>{formatDate(winner.selectedAt)}</p>
      </div>
    </div>
  );
}
