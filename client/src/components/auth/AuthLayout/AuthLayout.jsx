import { LoopMark } from '../../common/LoopMark';
import styles from './AuthLayout.module.css';

export function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className={styles.wrap}>
      <aside className={styles.panel}>
        <div className={styles.panelMark}>
          <LoopMark size={22} color="#fff" />
          VELOOP Rewards
        </div>

        <div>
          <h1 className={styles.panelHeadline}>Real rewards. Real winners. Fully transparent.</h1>
          <p className={styles.panelSub}>
            Join active giveaways, track your entries, and see exactly how winners are chosen — every step of the
            way.
          </p>
        </div>

        <div className={styles.panelStats}>
          <div className={styles.panelStat}>
            <strong>24</strong>
            <span>Giveaways run</span>
          </div>
          <div className={styles.panelStat}>
            <strong>8.5K+</strong>
            <span>Participants</span>
          </div>
          <div className={styles.panelStat}>
            <strong>1.2K+</strong>
            <span>Prizes won</span>
          </div>
        </div>

        <div className={styles.ringDecoration} aria-hidden="true" />
        <div className={styles.ringDecorationInner} aria-hidden="true" />
      </aside>

      <div className={styles.formSide}>
        <div className={styles.formCard}>
          <div className={styles.mobileMark}>
            <LoopMark size={22} color="var(--veloop-primary)" />
            VELOOP Rewards
          </div>

          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

          {children}

          {footer && <p className={styles.footerLine}>{footer}</p>}
        </div>
      </div>
    </div>
  );
}
