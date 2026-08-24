import { Sparkles } from 'lucide-react';
import { usePreviousWinners } from '../../../hooks/usePreviousWinners';
import styles from './WinnerSlider.module.css';

/**
 * A continuous CSS marquee (content duplicated once, animated -50%) rather than a
 * JS-interval slider — simpler, works at any width, and never "moves too quickly"
 * since it's a smooth continuous scroll rather than discrete jumps (spec §19).
 * Renders nothing if there's no real winner data yet — no fabricated activity
 * (spec §63: don't present dummy data as real activity).
 */
export function WinnerSlider() {
  const { winners, isLoading } = usePreviousWinners();

  if (isLoading || winners.length === 0) return null;

  const messages = winners.slice(0, 12);
  const loopMessages = [...messages, ...messages];

  return (
    <div className={styles.wrap} aria-label="Recent winners">
      <div className={styles.track}>
        {loopMessages.map((winner, index) => (
          // eslint-disable-next-line react/no-array-index-key -- content is duplicated for a seamless CSS loop, not reordered
          <span className={styles.pill} key={`${winner.id}-${index}`}>
            <Sparkles size={12} aria-hidden="true" />
            <strong>{winner.maskedUserId}</strong>
            &nbsp;won {winner.prizeName}
          </span>
        ))}
      </div>
    </div>
  );
}
