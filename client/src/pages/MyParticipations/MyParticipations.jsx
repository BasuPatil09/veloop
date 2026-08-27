import { Link } from 'react-router-dom';
import { Gift, Trophy, ChevronRight } from 'lucide-react';
import { useMyParticipations } from '../../hooks/useMyParticipations';
import { VeloopLoader } from '../../components/common/VeloopLoader/VeloopLoader';
import { ErrorState } from '../../components/common/ErrorState/ErrorState';
import { EmptyState } from '../../components/common/EmptyState/EmptyState';
import { formatEntryFee } from '../../utils/currencyFormatter';
import styles from './MyParticipations.module.css';

const STATUS_LABEL = { active: 'Live', upcoming: 'Upcoming', ended: 'Ended', archived: 'Ended' };
const STATUS_CLASS = { active: 'statusActive', upcoming: 'statusUpcoming', ended: 'statusEnded', archived: 'statusEnded' };

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MyParticipations() {
  const { participations, isLoading, error, retry } = useMyParticipations();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Entries</h1>
        <p className={styles.subtitle}>Every giveaway you&apos;ve joined, in one place.</p>
      </div>

      {isLoading && <VeloopLoader messages={['Loading your entries...']} />}

      {!isLoading && error && <ErrorState message={error} onRetry={retry} />}

      {!isLoading && !error && participations && participations.length === 0 && (
        <div className={styles.emptyWrap}>
          <EmptyState
            title="No Active Participation"
            message="Join a giveaway to start earning entries — they'll show up here."
          />
        </div>
      )}

      {!isLoading && !error && participations && participations.length > 0 && (
        <div className={styles.list}>
          {participations.map((entry) => (
            <Link to={`/giveaway/${entry.prize.slug}`} className={styles.row} key={entry.id}>
              <div className={styles.imageWrap}>
                {entry.prize.image ? (
                  <img src={entry.prize.image} alt={entry.prize.name} />
                ) : (
                  <Gift size={22} className={styles.imageFallbackIcon} aria-hidden="true" />
                )}
              </div>

              <div className={styles.body}>
                <p className={styles.prizeName}>{entry.prize.name}</p>
                <p className={styles.giveawayName}>{entry.giveaway.title}</p>
                <div className={styles.metaRow}>
                  <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[entry.giveaway.status]]}`}>
                    {STATUS_LABEL[entry.giveaway.status]}
                  </span>
                  <span className={styles.entryFee}>{formatEntryFee(entry.entryAmount, entry.entryCurrency)}</span>
                  <span className={styles.date}>Joined {formatDate(entry.joinedAt)}</span>
                  {entry.isWinner && (
                    <span className={styles.winnerBadge}>
                      <Trophy size={11} aria-hidden="true" />
                      Winner
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight size={18} className={styles.viewLink} aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
