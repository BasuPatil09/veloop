import { useState } from 'react';
import { useGiveaways } from '../../../hooks/useGiveaways';
import { useGiveawayWinners } from '../../../hooks/useGiveawayWinners';
import { usePreviousWinners } from '../../../hooks/usePreviousWinners';
import { WinnerCard } from '../WinnerCard/WinnerCard';
import { EmptyState } from '../../common/EmptyState/EmptyState';
import styles from './WinnersTabs.module.css';

export function WinnersTabs() {
  const [tab, setTab] = useState('current');
  const { giveaways } = useGiveaways();
  const currentActive = giveaways?.find((g) => g.status === 'active') ?? null;

  const { winners: currentWinners, finalized, isLoading: isCurrentLoading } = useGiveawayWinners(currentActive?.id);
  const { winners: previousWinners, isLoading: isPreviousLoading } = usePreviousWinners();

  return (
    <section className={styles.section} id="winners">
      <div className={styles.sectionHead}>
        <span className={styles.eyebrow}>Social Proof</span>
        <h2 className={styles.title}>Winners</h2>
      </div>

      <div className={styles.tabHeader} role="tablist" aria-label="Winners">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'current'}
          className={tab === 'current' ? styles.tabActive : styles.tab}
          onClick={() => setTab('current')}
        >
          Winners
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'previous'}
          className={tab === 'previous' ? styles.tabActive : styles.tab}
          onClick={() => setTab('previous')}
        >
          Previous Winners
        </button>
      </div>

      {tab === 'current' && (
        <div>
          {!currentActive && (
            <EmptyState title="No Current Giveaway" message="The next giveaway is being prepared." />
          )}
          {currentActive && isCurrentLoading && <p className={styles.loadingText}>Loading...</p>}
          {currentActive && !isCurrentLoading && !finalized && (
            <div className={styles.liveNotice}>
              <span className={styles.dotLive} aria-hidden="true" />
              Giveaway is still live — winners will be announced after it ends.
            </div>
          )}
          {currentActive && !isCurrentLoading && finalized && currentWinners.length === 0 && (
            <EmptyState title="No winners yet" message="Winners for this giveaway haven't been finalized." />
          )}
          {currentActive && !isCurrentLoading && finalized && currentWinners.length > 0 && (
            <div className={styles.grid}>
              {currentWinners.map((winner) => (
                <WinnerCard key={winner.id} winner={winner} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'previous' && (
        <div>
          {isPreviousLoading && <p className={styles.loadingText}>Loading...</p>}
          {!isPreviousLoading && previousWinners.length === 0 && (
            <EmptyState
              title="No Previous Winners"
              message="Previous winners will appear here after a giveaway is completed."
            />
          )}
          {!isPreviousLoading && previousWinners.length > 0 && (
            <div className={styles.grid}>
              {previousWinners.map((winner) => (
                <WinnerCard key={winner.id} winner={winner} showGiveawayName />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
