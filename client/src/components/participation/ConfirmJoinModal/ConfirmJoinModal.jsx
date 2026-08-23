import { Gift } from 'lucide-react';
import { Modal } from '../../common/Modal/Modal';
import { Button } from '../../common/Button/Button';
import { Alert } from '../../common/Alert/Alert';
import { formatEntryFee } from '../../../utils/currencyFormatter';
import styles from './ConfirmJoinModal.module.css';

export function ConfirmJoinModal({ isOpen, onClose, prize, balance, onConfirm, isJoining, error }) {
  const balanceAfter = Math.max(balance - prize.entryAmount, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Participation">
      <div className={styles.prizeRow}>
        <Gift size={18} aria-hidden="true" />
        {prize.name}
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Entry Fee</span>
          <span className={styles.rowValue}>{formatEntryFee(prize.entryAmount, prize.entryCurrency)}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Your Balance</span>
          <span className={styles.rowValue}>{formatEntryFee(balance, prize.entryCurrency)}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Balance After Joining</span>
          <span className={styles.rowValueEmphasis}>{formatEntryFee(balanceAfter, prize.entryCurrency)}</span>
        </div>
      </div>

      <p className={styles.disclaimer}>
        By continuing, you confirm that you have reviewed the giveaway rules and terms.
      </p>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onClose} disabled={isJoining}>
          Cancel
        </Button>
        <Button onClick={onConfirm} isLoading={isJoining} loadingText="Joining Giveaway...">
          Confirm &amp; Join
        </Button>
      </div>
    </Modal>
  );
}
