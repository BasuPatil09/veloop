import { useState } from 'react';
import { CheckCircle2, PartyPopper } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useParticipation } from '../../../hooks/useParticipation';
import { ConfirmJoinModal } from '../ConfirmJoinModal/ConfirmJoinModal';
import { LoginRequiredModal } from '../LoginRequiredModal/LoginRequiredModal';
import { Button } from '../../common/Button/Button';
import { formatEntryFee } from '../../../utils/currencyFormatter';
import styles from './ParticipationCTA.module.css';

export function ParticipationCTA({ prize, giveaway }) {
  const { isAuthenticated, user } = useAuth();
  const { joined, isStatusLoading, join, isJoining, joinError, resetJoinError } = useParticipation(prize.id);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [justJoined, setJustJoined] = useState(false);

  if (giveaway.status === 'upcoming') {
    return (
      <div className={styles.wrap}>
        <Button disabled>Notify Me — Starts Soon</Button>
      </div>
    );
  }

  if (giveaway.status === 'ended' || giveaway.status === 'archived') {
    return (
      <div className={styles.wrap}>
        <Button disabled>Giveaway Ended</Button>
      </div>
    );
  }

  if (isAuthenticated && isStatusLoading) {
    return (
      <div className={styles.wrap}>
        <Button disabled isLoading loadingText="Checking your entry...">
          Checking your entry...
        </Button>
      </div>
    );
  }

  if (joined) {
    return (
      <div className={`${styles.wrap} ${styles.joinedCard}`}>
        {justJoined ? (
          <>
            <PartyPopper size={20} className={styles.successIcon} aria-hidden="true" />
            <div>
              <p className={styles.joinedTitle}>You&apos;re In!</p>
              <p className={styles.joinedSubtitle}>Your entry for {prize.name} has been recorded. Good luck!</p>
            </div>
          </>
        ) : (
          <>
            <CheckCircle2 size={20} className={styles.successIcon} aria-hidden="true" />
            <div>
              <p className={styles.joinedTitle}>You&apos;re Already Participating</p>
              <p className={styles.joinedSubtitle}>Your entry has already been recorded for this giveaway.</p>
            </div>
          </>
        )}
      </div>
    );
  }

  const handleJoinClick = () => {
    if (!isAuthenticated) {
      setIsLoginPromptOpen(true);
      return;
    }
    resetJoinError();
    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    try {
      await join();
      setJustJoined(true);
      setIsConfirmOpen(false);
    } catch {
      // joinError is already set by the hook and rendered inline in the modal —
      // keep the modal open so the user can see the error and retry.
    }
  };

  return (
    <div className={styles.wrap}>
      <Button onClick={handleJoinClick}>Join for {formatEntryFee(prize.entryAmount, prize.entryCurrency)}</Button>

      <LoginRequiredModal isOpen={isLoginPromptOpen} onClose={() => setIsLoginPromptOpen(false)} />

      {isAuthenticated && (
        <ConfirmJoinModal
          isOpen={isConfirmOpen}
          onClose={() => {
            setIsConfirmOpen(false);
            resetJoinError();
          }}
          prize={prize}
          balance={user.balances[prize.entryCurrency.toLowerCase()]}
          onConfirm={handleConfirm}
          isJoining={isJoining}
          error={joinError}
        />
      )}
    </div>
  );
}
