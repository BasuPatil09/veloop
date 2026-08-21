import { useAuth } from '../../hooks/useAuth';

export default function MyParticipations() {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: 640, margin: '64px auto', padding: '0 24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.6rem' }}>My Entries</h1>
      <p style={{ color: 'var(--veloop-text-muted)', marginTop: 8 }}>
        Hi {user?.name} — your giveaway participation history will appear here once the join flow ships in Phase 3.
      </p>
    </div>
  );
}
