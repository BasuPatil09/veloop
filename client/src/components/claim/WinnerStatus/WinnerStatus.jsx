import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PartyPopper } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useClaim } from '../../../hooks/useClaim';
import { ClaimStatusBadge } from '../ClaimStatusBadge/ClaimStatusBadge';
import { PrizeClaimModal } from '../PrizeClaimModal/PrizeClaimModal';
import { Button } from '../../common/Button/Button';
import styles from './WinnerStatus.module.css';

export function WinnerStatus({ prize }) {
  const { isAuthenticated } = useAuth();
  const { isWinner, winnersFinalized, winner, claim, isLoading, submitClaim, isSubmitting, submitError } =
    useClaim(prize.id);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  // A brief, controlled "revealing" beat before the winner card animates in —
  // deliberately not a slot-machine spin or repeated randomization, just a single
  // considered pause (spec §47: polished, not gambling-like).
  const [hasRevealed, setHasRevealed] = useState(false);

  useEffect(() => {
    if (!isWinner || isLoading) return undefined;
    const timeout = window.setTimeout(() => setHasRevealed(true), 400);
    return () => window.clearTimeout(timeout);
  }, [isWinner, isLoading]);

  if (!isAuthenticated) {
    return (
      <div className={styles.neutralCard}>
        <p className={styles.neutralTitle}>Giveaway Ended</p>
        <p className={styles.neutralText}>Log in to see if you won.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.neutralCard}>
        <p className={styles.neutralText}>Checking results...</p>
      </div>
    );
  }

  if (!isWinner && !winnersFinalized) {
    return (
      <div className={styles.neutralCard}>
        <p className={styles.neutralTitle}>Giveaway Ended</p>
        <p className={styles.neutralText}>Winners haven&apos;t been announced yet. Check back soon.</p>
      </div>
    );
  }

  if (!isWinner) {
    return (
      <div className={styles.neutralCard}>
        <p className={styles.neutralTitle}>Didn&apos;t win this time?</p>
        <p className={styles.neutralText}>
          Winners have been announced. Keep participating for the next giveaway.
        </p>
        <Link to="/" className={styles.exploreLink}>
          Explore Next Giveaway &rarr;
        </Link>
      </div>
    );
  }

  if (!hasRevealed) {
    return (
      <div className={styles.neutralCard}>
        <p className={styles.neutralText}>Revealing your result...</p>
      </div>
    );
  }

  return (
    <motion.div
      className={styles.winnerCard}
      initial={{ opacity: 0, scale: 0.96, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0.7, 0.3, 1] }}
    >
      <PartyPopper size={22} className={styles.winnerIcon} aria-hidden="true" />
      <div className={styles.winnerBody}>
        <p className={styles.winnerTitle}>Congratulations! You won {prize.name}!</p>

        <div className={styles.winnerMeta}>
          <ClaimStatusBadge status={claim?.status} />
          {claim?.status === 'NOT_SUBMITTED' && winner?.claimDeadline && (
            <span className={styles.deadline}>Claim within 7 days</span>
          )}
        </div>

        {claim?.status === 'NOT_SUBMITTED' && (
          <Button fullWidth={false} onClick={() => setIsClaimModalOpen(true)}>
            Claim Your Prize
          </Button>
        )}
      </div>

      <PrizeClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        prize={prize}
        onSubmit={submitClaim}
        isSubmitting={isSubmitting}
        error={submitError}
      />
    </motion.div>
  );
}
