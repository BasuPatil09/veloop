import { ShieldCheck, Eye, Scale, FileText } from 'lucide-react';
import styles from './TrustSection.module.css';

// Deliberately no "100% guaranteed" or similarly unsupported claims (spec §26/§43) —
// each point describes a practice this platform actually follows, not a promise
// about outcomes.
const POINTS = [
  {
    icon: Eye,
    title: 'Transparent Rules',
    text: 'Entry requirements, winner counts, and giveaway duration are shown on every prize page before you join.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure by Design',
    text: 'Balances and entries are verified server-side on every request — never trusted from the browser.',
  },
  {
    icon: Scale,
    title: 'Fair Participation',
    text: 'One entry per account per prize, enforced at the database level, not just in the interface.',
  },
  {
    icon: FileText,
    title: 'Reward Transparency',
    text: 'Prize details and claim requirements are shown up front, before you spend anything.',
  },
];

export function TrustSection() {
  return (
    <section className={styles.section} id="trust">
      <div className={styles.sectionHead}>
        <span className={styles.eyebrow}>Why Trust Us</span>
        <h2 className={styles.title}>Built to Be Transparent</h2>
      </div>

      <div className={styles.grid}>
        {POINTS.map((point) => {
          const Icon = point.icon;
          return (
            <div className={styles.card} key={point.title}>
              <div className={styles.iconWrap}>
                <Icon size={20} aria-hidden="true" />
              </div>
              <p className={styles.cardTitle}>{point.title}</p>
              <p className={styles.cardText}>{point.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
