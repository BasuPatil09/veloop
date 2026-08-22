import { Link } from 'react-router-dom';
import { Gift, Trophy, ArrowRight } from 'lucide-react';
import { Countdown } from '../Countdown/Countdown';
import { formatEntryFee } from '../../../utils/currencyFormatter';
import styles from './PrizeCard.module.css';

const CTA_LABEL = {
  active: 'Join Now',
  upcoming: 'Get Ready',
  ended: 'View Results',
  archived: 'View Results',
};

/**
 * Renders ONE prize (its own entry fee/currency/slug), with status/countdown
 * inherited from its parent giveaway. The CTA always navigates to the individual
 * giveaway page — per spec, it must never join directly from the card.
 */
export function PrizeCard({ prize, giveaway }) {
  const isActive = giveaway.status === 'active';
  const isUpcoming = giveaway.status === 'upcoming';
  const countdownTarget = isActive ? giveaway.endAt : isUpcoming ? giveaway.startAt : null;

  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        {prize.image ? (
          <img src={prize.image} alt={prize.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Gift size={40} className={styles.imageFallbackIcon} aria-hidden="true" />
        )}

        {prize.position && <span className={styles.position}>{prize.position}</span>}

        <span className={styles.statusBadge}>
          {isActive && <span className={styles.dotLive} aria-hidden="true" />}
          {isUpcoming && <span className={styles.dotUpcoming} aria-hidden="true" />}
          {isActive ? 'Live' : isUpcoming ? 'Upcoming' : 'Ended'}
        </span>
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{prize.name}</h3>
        {prize.description && <p className={styles.description}>{prize.description}</p>}

        <div className={styles.metaRow}>
          <span className={styles.winnersTag}>
            <Trophy size={13} aria-hidden="true" />
            {prize.winnerCount} {prize.winnerCount === 1 ? 'Winner' : 'Winners'}
          </span>
        </div>

        {countdownTarget && (
          <div className={styles.countdownRow}>
            <Countdown targetDate={countdownTarget} size="sm" />
          </div>
        )}

        <div className={styles.entrySection}>
          <div className={styles.entryFee}>
            <span className={styles.entryFeeLabel}>Entry Fee</span>
            <span className={styles.entryFeeValue}>{formatEntryFee(prize.entryAmount, prize.entryCurrency)}</span>
          </div>

          <Link to={`/giveaway/${prize.slug}`} className={styles.cta}>
            {CTA_LABEL[giveaway.status] || 'View Details'}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
