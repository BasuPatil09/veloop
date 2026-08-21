import { AlertCircle, CheckCircle2 } from 'lucide-react';
import styles from './Alert.module.css';

export function Alert({ type = 'error', children }) {
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div className={`${styles.alert} ${styles[type]}`} role="alert">
      <Icon size={18} className={styles.icon} />
      <span>{children}</span>
    </div>
  );
}
