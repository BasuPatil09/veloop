import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Gift, Sparkles, Trophy } from 'lucide-react';
import { useGiveaway } from '../../hooks/useGiveaway';
import { VeloopLoader } from '../../components/common/VeloopLoader/VeloopLoader';
import { ErrorState } from '../../components/common/ErrorState/ErrorState';
import { Countdown } from '../../components/giveaway/Countdown/Countdown';
import { ParticipationCTA } from '../../components/participation/ParticipationCTA/ParticipationCTA';
import { WinnerStatus } from '../../components/claim/WinnerStatus/WinnerStatus';
import { formatEntryFee } from '../../utils/currencyFormatter';
import styles from './GiveawayDetails.module.css';

const STATUS_LABEL = { active: 'Live', upcoming: 'Upcoming', ended: 'Ended', archived: 'Ended' };

const HOW_IT_WORKS = [
  { title: 'Review the giveaway', text: 'Check the prize, rules, and entry requirement before joining.' },
  { title: 'Confirm your entry', text: 'See your balance and the exact cost before you pay anything.' },
  { title: 'Entry recorded', text: 'Your participation is recorded the moment payment succeeds.' },
  { title: 'Wait for the giveaway to end', text: 'The countdown on this page tells you exactly when.' },
  { title: 'Winner is selected', text: 'Winners are chosen after the giveaway closes, never before.' },
  { title: 'Winner claims the prize', text: 'Winners get a claim form and a deadline to submit it.' },
];

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function GiveawayDetails() {
  const { slug } = useParams();
  const { prize, giveaway, isLoading, error, notFound, retry } = useGiveaway(slug);

  if (isLoading) return <VeloopLoader messages={['Loading giveaway details...']} />;

  if (notFound) {
    return (
      <div className={styles.section}>
        <ErrorState title="Giveaway not found" message="This giveaway may have been removed or the link is incorrect." />
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Link to="/">&larr; Back to Giveaway Home</Link>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  const isActive = giveaway.status === 'active';
  const isUpcoming = giveaway.status === 'upcoming';
  const countdownTarget = isActive ? giveaway.endAt : isUpcoming ? giveaway.startAt : null;

  return (
    <>
      <div className={styles.backNav}>
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={15} aria-hidden="true" />
          Giveaway Home
        </Link>
      </div>

      <div className={styles.hero}>
        <div className={styles.imagePanel}>
          {prize.image ? (
            <img src={prize.image} alt={prize.name} />
          ) : (
            <Gift size={64} className={styles.imageFallbackIcon} aria-hidden="true" />
          )}
        </div>

        <div className={styles.infoCol}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>
              <Sparkles size={12} aria-hidden="true" />
              Exclusive Giveaway
            </span>
            <span className={styles.statusPill}>
              {isActive && <span className={styles.dotLive} aria-hidden="true" />}
              {STATUS_LABEL[giveaway.status]}
            </span>
          </div>

          <h1 className={styles.title}>{prize.name}</h1>
          {prize.description && <p className={styles.description}>{prize.description}</p>}

          {countdownTarget && (
            <div className={styles.countdownBlock}>
              <span className={styles.countdownLabel}>{isActive ? 'Ends In' : 'Starts In'}</span>
              <Countdown targetDate={countdownTarget} onComplete={retry} />
            </div>
          )}

          <div className={styles.infoCard}>
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Winners</span>
                <span className={styles.metaValue}>
                  <Trophy size={13} style={{ marginRight: 4, verticalAlign: -2 }} aria-hidden="true" />
                  {prize.winnerCount}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Giveaway</span>
                <span className={styles.metaValue}>{giveaway.title}</span>
              </div>
            </div>

            <div className={styles.entryFeeRow}>
              <span className={styles.entryFeeLabel}>Entry Fee</span>
              <span className={styles.entryFeeValue}>{formatEntryFee(prize.entryAmount, prize.entryCurrency)}</span>
            </div>

            {isActive || isUpcoming ? (
              <ParticipationCTA prize={prize} giveaway={giveaway} />
            ) : (
              <WinnerStatus prize={prize} />
            )}
          </div>
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How This Giveaway Works</h2>
        <div className={styles.stepList}>
          {HOW_IT_WORKS.map((step, index) => (
            <div className={styles.step} key={step.title}>
              <div className={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</div>
              <div className={styles.stepTitle}>{step.title}</div>
              <p className={styles.stepText}>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Terms &amp; Conditions</h2>
        <div className={styles.termsCard}>
          <span className={styles.placeholderBadge}>Demo / Placeholder Content</span>
          <div className={styles.termsList}>
            <div className={styles.termsRow}>
              <span className={styles.termsRowLabel}>Eligibility</span>
              <span className={styles.termsRowValue}>
                Open to registered VELOOP Rewards users. Placeholder — real eligibility rules to be confirmed.
              </span>
            </div>
            <div className={styles.termsRow}>
              <span className={styles.termsRowLabel}>Entry Requirement</span>
              <span className={styles.termsRowValue}>{formatEntryFee(prize.entryAmount, prize.entryCurrency)}</span>
            </div>
            <div className={styles.termsRow}>
              <span className={styles.termsRowLabel}>Giveaway Duration</span>
              <span className={styles.termsRowValue}>
                {formatDate(giveaway.startAt)} – {formatDate(giveaway.endAt)}
              </span>
            </div>
            <div className={styles.termsRow}>
              <span className={styles.termsRowLabel}>Winner Selection</span>
              <span className={styles.termsRowValue}>
                Selected after the giveaway ends. Selection process to be finalized — placeholder.
              </span>
            </div>
            <div className={styles.termsRow}>
              <span className={styles.termsRowLabel}>Prize Claim</span>
              <span className={styles.termsRowValue}>
                Winners receive a claim form and a claim window. Placeholder — exact deadline to be confirmed.
              </span>
            </div>
            <div className={styles.termsRow}>
              <span className={styles.termsRowLabel}>Disqualification</span>
              <span className={styles.termsRowValue}>
                Suspicious, fraudulent, or rule-breaking activity may result in disqualification, per platform
                policy.
              </span>
            </div>
            <div className={styles.termsRow}>
              <span className={styles.termsRowLabel}>Entry Policy</span>
              <span className={styles.termsRowValue}>
                Placeholder — the official refund/entry policy has not been finalized for this demo.
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
