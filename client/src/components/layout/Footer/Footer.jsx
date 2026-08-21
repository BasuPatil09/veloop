import { Link } from 'react-router-dom';
import { LoopMark } from '../../common/LoopMark';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <div className={styles.brand}>
            <LoopMark size={22} color="#fff" />
            VELOOP Rewards
          </div>
          <p className={styles.tagline}>
            A transparent, entry-based rewards platform. Complete eligible activities, earn entries, and get a
            chance to win real prizes.
          </p>
        </div>

        <div>
          <div className={styles.columnTitle}>Giveaways</div>
          <ul className={styles.linkList}>
            <li>
              <Link to="/">Giveaway Home</Link>
            </li>
            <li>
              <Link to="/#rules">Rules &amp; Guidelines</Link>
            </li>
            <li>
              <Link to="/#faq">FAQ</Link>
            </li>
          </ul>
        </div>

        <div>
          <div className={styles.columnTitle}>Support</div>
          <ul className={styles.linkList}>
            <li>
              <a href="mailto:support@veloop.example">Contact support</a>
            </li>
            <li>
              <Link to="/#trust">Terms &amp; Privacy</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} VELOOP Rewards. Demo project — not a real prize platform.</span>
        <span>Giveaways are for entertainment; no purchase increases odds of winning.</span>
      </div>
    </footer>
  );
}
