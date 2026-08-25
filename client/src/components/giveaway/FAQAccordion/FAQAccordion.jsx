import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './FAQAccordion.module.css';

const FAQS = [
  { q: 'How do I participate?', a: 'Create an account, open a prize you\u2019re interested in, and join it for its listed entry fee in VEs, SVEs, or Tokens.' },
  { q: 'How are winners selected?', a: 'Winners are chosen at random from everyone who joined that prize, once the giveaway has ended.' },
  { q: 'When are winners announced?', a: 'As soon as an admin finalizes winners after the giveaway ends — you\u2019ll see it on the prize page and in the Winners tab.' },
  { q: 'What happens if I win?', a: 'You\u2019ll see a "Congratulations" banner on that prize\u2019s page with a Claim Your Prize button and a claim deadline.' },
  { q: 'How do I claim my prize?', a: 'Physical prizes ask for a name, phone, and delivery address. Gift cards only ask for an email address.' },
  { q: 'Can I participate in multiple giveaways?', a: 'Yes — entry is tracked per prize, so you can join different prizes (even within the same giveaway) separately.' },
  { q: 'What happens after the giveaway ends?', a: 'No new entries are accepted, winners are selected, and the giveaway moves to the Previous Winners tab.' },
];

function FAQItem({ question, answer, isOpen, onToggle }) {
  const contentId = useId();

  return (
    <div className={styles.item}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={onToggle}
      >
        {question}
        <ChevronDown size={18} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} aria-hidden="true" />
      </button>
      {isOpen && (
        <p id={contentId} className={styles.answer}>
          {answer}
        </p>
      )}
    </div>
  );
}

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className={styles.section} id="faq">
      <div className={styles.sectionHead}>
        <span className={styles.eyebrow}>Questions</span>
        <h2 className={styles.title}>Frequently Asked Questions</h2>
      </div>

      <div className={styles.list}>
        {FAQS.map((faq, index) => (
          <FAQItem
            key={faq.q}
            question={faq.q}
            answer={faq.a}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex((current) => (current === index ? null : index))}
          />
        ))}
      </div>
    </section>
  );
}
