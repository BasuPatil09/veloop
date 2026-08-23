import { useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Modal } from '../../common/Modal/Modal';
import { Button } from '../../common/Button/Button';
import styles from './LoginRequiredModal.module.css';

export function LoginRequiredModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const goTo = (path) => {
    onClose();
    navigate(path, { state: { from: location } });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Login Required">
      <div className={styles.wrap}>
        <LogIn size={28} className={styles.icon} aria-hidden="true" />
        <p className={styles.message}>
          Please login to your VELOOP Rewards account before participating in this giveaway.
        </p>
        <div className={styles.actions}>
          <Button onClick={() => goTo('/login')}>Login</Button>
          <Button variant="secondary" onClick={() => goTo('/register')}>
            Create Account
          </Button>
        </div>
      </div>
    </Modal>
  );
}
