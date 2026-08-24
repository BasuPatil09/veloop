import styles from './ClaimStatusBadge.module.css';

const STATUS_CONFIG = {
  SUBMITTED: { label: 'Claim Submitted ✓', tone: 'info' },
  PROCESSING: { label: 'Prize Verification In Progress', tone: 'info' },
  COMPLETED: { label: 'Prize Delivered ✓', tone: 'success' },
  EXPIRED: { label: 'Claim Window Expired', tone: 'danger' },
};

/** Renders nothing for NOT_SUBMITTED — the Claim button itself is the indicator at that stage. */
export function ClaimStatusBadge({ status }) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;
  return <span className={`${styles.badge} ${styles[config.tone]}`}>{config.label}</span>;
}
