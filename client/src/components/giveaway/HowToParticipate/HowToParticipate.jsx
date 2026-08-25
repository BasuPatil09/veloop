import { UserPlus, ListChecks, Ticket, Trophy } from 'lucide-react';
import styles from './HowToParticipate.module.css';

const STEPS = [
  { icon: UserPlus, title: 'Sign Up / Login', text: 'Create a free VELOOP Rewards account.' },
  { icon: ListChecks, title: 'Review a Giveaway', text: 'Pick a prize and check the entry requirement.' },
  { icon: Ticket, title: 'Join with Entries', text: 'Pay the entry fee in VEs, SVEs, or Tokens.' },
  { icon: Trophy, title: 'Win Rewards', text: 'Winners are selected after the giveaway ends.' },
];

export function HowToParticipate() {
  return (
    <section className={styles.section} id="how-it-works">
      <div className={styles.sectionHead}>
        <span className={styles.eyebrow}>Getting Started</span>
        <h2 className={styles.title}>How to Participate</h2>
      </div>

      <div className={styles.timeline}>
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <div className={styles.step} key={step.title}>
              <div className={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</div>
              <Icon size={20} color="var(--veloop-primary)" aria-hidden="true" />
              <p className={styles.stepTitle}>{step.title}</p>
              <p className={styles.stepText}>{step.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
