import styles from './GiveawayRules.module.css';

// Explicitly marked as demo/placeholder — the actual VELOOP policies aren't
// finalized, and the spec is explicit that we must not invent official policy
// (spec §27/§44). Same pattern as the individual giveaway page's T&C section.
const RULES = [
  { label: 'Eligibility', text: 'Open to registered VELOOP Rewards users. Real eligibility criteria to be confirmed.' },
  { label: 'Entry Rules', text: 'Each account may enter a given prize once, using the currency and amount shown on that prize\u2019s page.' },
  { label: 'Winner Selection', text: 'Winners are selected at random from eligible participants after a giveaway ends.' },
  { label: 'Prize Claim Period', text: 'Winners are given a claim window to submit their details. Exact duration to be confirmed.' },
  { label: 'Disqualification', text: 'Suspicious, fraudulent, or rule-breaking activity may result in disqualification, per platform policy.' },
  { label: 'Fraud & Abuse Policy', text: 'Automated signals (device/account patterns) may flag or block suspicious entries. Placeholder — full policy to be confirmed.' },
];

export function GiveawayRules() {
  return (
    <section className={styles.section} id="rules">
      <div className={styles.sectionHead}>
        <span className={styles.eyebrow}>Fine Print</span>
        <h2 className={styles.title}>Giveaway Rules &amp; Guidelines</h2>
      </div>

      <div className={styles.card}>
        <span className={styles.placeholderBadge}>Demo / Placeholder Content</span>
        <div className={styles.list}>
          {RULES.map((rule) => (
            <div className={styles.item} key={rule.label}>
              <span className={styles.itemLabel}>{rule.label}</span>
              <span className={styles.itemText}>{rule.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
