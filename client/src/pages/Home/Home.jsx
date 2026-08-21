import { useAuth } from '../../hooks/useAuth';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div style={{ maxWidth: 720, margin: '64px auto', padding: '0 24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 12 }}>VELOOP Rewards — Giveaway Home</h1>
      <p style={{ color: 'var(--veloop-text-muted)' }}>
        Phase 0 + Phase 1 checkpoint: routing, auth, and the app shell are wired up.
        The hero, stats, prize cards, winner slider, and the rest of the giveaway experience land in Phase 2.
      </p>
      <p style={{ marginTop: 20, fontSize: '0.9rem', color: 'var(--veloop-text-muted)' }}>
        {isAuthenticated ? `Logged in as ${user.name} (${user.role})` : 'Not logged in'}
      </p>
    </div>
  );
}
