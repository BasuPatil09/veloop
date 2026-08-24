import { useState } from 'react';
import { Modal } from '../../common/Modal/Modal';
import { Alert } from '../../common/Alert/Alert';
import { PhysicalClaimForm } from '../PhysicalClaimForm/PhysicalClaimForm';
import { GiftCardClaimForm } from '../GiftCardClaimForm/GiftCardClaimForm';
import styles from './PrizeClaimModal.module.css';

export function PrizeClaimModal({ isOpen, onClose, prize, onSubmit, isSubmitting, error }) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const isGiftCard = prize.claimType === 'EMAIL';

  const handleSubmit = async (payload) => {
    try {
      await onSubmit(payload);
      setIsSubmitted(true);
    } catch {
      // submitError is already set by useClaim and rendered below — the modal
      // stays open with the form intact so the user can correct and retry.
    }
  };

  const handleClose = () => {
    onClose();
    // Let the close animation finish before resetting, so "Submitted" doesn't
    // visibly flash back to the form for a frame.
    window.setTimeout(() => setIsSubmitted(false), 200);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isGiftCard ? 'Claim Gift Card' : 'Claim Your Prize'}>
      {isSubmitted ? (
        <div className={styles.successState}>
          <p className={styles.successTitle}>Claim Submitted ✓</p>
          <p className={styles.successText}>Our team will process your prize shortly.</p>
        </div>
      ) : (
        <>
          <p className={styles.prizeLine}>
            You won <strong>{prize.name}</strong>
          </p>

          {error && <Alert type="error">{error}</Alert>}

          {isGiftCard ? (
            <GiftCardClaimForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          ) : (
            <PhysicalClaimForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          )}
        </>
      )}
    </Modal>
  );
}
