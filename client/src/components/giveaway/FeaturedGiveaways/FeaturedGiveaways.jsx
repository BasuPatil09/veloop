import { motion } from 'framer-motion';
import { useGiveaways } from '../../../hooks/useGiveaways';
import { PrizeCard } from '../PrizeCard/PrizeCard';
import { ErrorState } from '../../common/ErrorState/ErrorState';
import { EmptyState } from '../../common/EmptyState/EmptyState';
import styles from './FeaturedGiveaways.module.css';

function SkeletonGrid() {
  return (
    <div className={styles.grid} aria-hidden="true">
      {Array.from({ length: 3 }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={i} className={styles.skeletonCard} />
      ))}
    </div>
  );
}

export function FeaturedGiveaways() {
  const { giveaways, isLoading, error, retry } = useGiveaways();

  return (
    <section className={styles.section} id="featured-giveaways" aria-label="Featured giveaways">
      <div className={styles.sectionHead}>
        <span className={styles.eyebrow}>Live &amp; Upcoming</span>
        <h2 className={styles.title}>Featured Giveaways</h2>
      </div>

      {isLoading && <SkeletonGrid />}

      {!isLoading && error && (
        <ErrorState message="We couldn't load the giveaway information." onRetry={retry} />
      )}

      {!isLoading && !error && giveaways && giveaways.length === 0 && (
        <EmptyState
          title="No current giveaway"
          message="The next giveaway is being prepared. Check back soon."
        />
      )}

      {!isLoading &&
        !error &&
        giveaways &&
        giveaways.length > 0 &&
        giveaways.map((giveaway) => (
          <div className={styles.campaign} key={giveaway.id}>
            {giveaways.length > 1 && <h3 className={styles.campaignTitle}>{giveaway.title}</h3>}
            <div className={styles.grid}>
              {giveaway.prizes.map((prize, index) => (
                <motion.div
                  key={prize.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: (index % 3) * 0.06, ease: [0.2, 0.7, 0.3, 1] }}
                >
                  <PrizeCard prize={prize} giveaway={giveaway} />
                </motion.div>
              ))}
            </div>
          </div>
        ))}
    </section>
  );
}
