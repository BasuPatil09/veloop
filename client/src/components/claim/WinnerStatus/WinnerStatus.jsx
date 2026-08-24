import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PartyPopper } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useClaim } from '../../../hooks/useClaim';
import { ClaimStatusBadge } from '../ClaimStatusBadge/ClaimStatusBadge';
import { PrizeClaimModal } from '../PrizeClaimModal/PrizeClaimModal';
import { Button } from '../../common/Button/Button';
import styles from './WinnerStatus.module.css';

export function WinnerStatus({ prize }) {
  const { isAuthenticated } = useAuth();
  const { isWinner, winner, claim, isLoading, submitClaim, isSubmitting, submitError } = useClaim(prize.id);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

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

  return (
    <div className={styles.winnerCard}>
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
    </div>
  );
}
