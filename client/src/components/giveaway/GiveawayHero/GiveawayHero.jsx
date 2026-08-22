import { Sparkles, ArrowRight } from 'lucide-react';
import styles from './GiveawayHero.module.css';

export function GiveawayHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.copy}>
        <span className={styles.badge}>
          <Sparkles size={13} aria-hidden="true" />
          Exclusive Giveaways
        </span>

        <h1 className={styles.headline}>Real rewards, up for grabs.</h1>

        <p className={styles.subtext}>
          Complete eligible activities, collect entries, and get a chance to win real prizes — every giveaway is
          transparent about the rules, the odds, and how winners are chosen.
        </p>

        <div className={styles.actions}>
          <a href="#featured-giveaways" className={styles.ctaPrimary}>
            Explore Giveaways
            <ArrowRight size={16} aria-hidden="true" />
          </a>
          <a href="#how-it-works" className={styles.ctaSecondary}>
            How it works
          </a>
        </div>
      </div>

      <div className={styles.panel} aria-hidden="true">
        <svg className={styles.illustration} viewBox="0 0 320 260" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Loop-mark rings, oversized and translucent, behind the gift box */}
          <circle cx="150" cy="130" r="92" stroke="rgba(255,255,255,0.14)" strokeWidth="2" />
          <circle cx="190" cy="130" r="92" stroke="rgba(184,137,43,0.35)" strokeWidth="2" />

          {/* Gift box */}
          <g>
            <rect x="108" y="118" width="104" height="90" rx="8" fill="#F7F5EE" />
            <rect x="108" y="118" width="104" height="24" rx="6" fill="#EDE8D8" />
            <rect x="152" y="118" width="16" height="90" fill="#B8892B" />
            <rect x="108" y="134" width="104" height="10" fill="#B8892B" />
            {/* Ribbon bow */}
            <path
              d="M160 118 C144 100, 118 100, 128 118 C118 100, 148 92, 160 118 Z"
              fill="#B8892B"
            />
            <path
              d="M160 118 C176 100, 202 100, 192 118 C202 100, 172 92, 160 118 Z"
              fill="#8f6a20"
            />
          </g>

          {/* Floating ticket */}
          <g className={styles.floatMedium}>
            <rect x="34" y="150" width="58" height="34" rx="6" transform="rotate(-10 34 150)" fill="#145C52" />
            <circle cx="46" cy="163" r="2.5" transform="rotate(-10 34 150)" fill="#fff" opacity="0.8" />
          </g>

          {/* Floating coins */}
          <circle className={styles.floatSlow} cx="252" cy="86" r="16" fill="#B8892B" />
          <circle className={styles.floatSlow} cx="252" cy="86" r="16" fill="none" stroke="#F6ECD8" strokeOpacity="0.4" strokeWidth="1.5" />
          <circle className={styles.floatFast} cx="70" cy="72" r="11" fill="#F6ECD8" />
          <circle className={styles.floatMedium} cx="238" cy="176" r="9" fill="#F6ECD8" opacity="0.85" />
        </svg>
      </div>
    </section>
  );
}
