import { Link, useParams } from 'react-router-dom';

export default function GiveawayDetails() {
  const { slug } = useParams();

  return (
    <div style={{ maxWidth: 640, margin: '64px auto', padding: '0 24px', textAlign: 'center' }}>
      <Link to="/">&larr; Giveaway Home</Link>
      <h1 style={{ fontSize: '1.6rem', marginTop: 16 }}>Giveaway: {slug}</h1>
      <p style={{ color: 'var(--veloop-text-muted)', marginTop: 8 }}>
        The full prize detail, entry fee, terms, and join flow for this giveaway land in Phase 3.
      </p>
    </div>
  );
}
