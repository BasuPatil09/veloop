import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ maxWidth: 480, margin: '96px auto', padding: '0 24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.8rem' }}>Page not found</h1>
      <p style={{ color: 'var(--veloop-text-muted)', margin: '10px 0 20px' }}>
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link to="/">&larr; Back to Giveaway Home</Link>
    </div>
  );
}
