import { useGiveawayStats } from '../../../hooks/useGiveawayStats';
import { formatStatCount } from '../../../utils/currencyFormatter';
import styles from './GiveawayStats.module.css';

const STAT_DEFS = [
  { key: 'totalGiveaways', label: 'Giveaways Run' },
  { key: 'activeGiveaways', label: 'Active Now' },
  { key: 'totalParticipants', label: 'Participants' },
  { key: 'prizesWon', label: 'Prizes Won' },
];

export function GiveawayStats() {
  const { stats, isLoading, error } = useGiveawayStats();

  // Stats are a supporting element, not the main content — if they fail to load,
  // fail quietly rather than showing an error banner in the middle of the home page.
  // We never fall back to fabricated numbers (spec §60): loading or nothing.
  if (error) return null;

  return (
    <section className={styles.section} aria-label="Giveaway statistics">
      <div className={styles.grid}>
        {STAT_DEFS.map((def) => (
          <div className={styles.stat} key={def.key}>
            {isLoading ? (
              <span className={styles.skeletonValue} aria-hidden="true" />
            ) : (
              <span className={styles.value}>{formatStatCount(stats[def.key])}</span>
            )}
            <span className={styles.label}>{def.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
