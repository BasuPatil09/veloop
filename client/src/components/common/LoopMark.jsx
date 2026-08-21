/** The VELOOP "loop" mark: two interlocking rings — the one recurring signature shape used across the brand (logo, focus accents, reward reveal), everywhere else stays quiet. */
export function LoopMark({ size = 28, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="12" cy="16" r="8" stroke={color} strokeWidth="2.25" />
      <circle cx="20" cy="16" r="8" stroke={color} strokeWidth="2.25" />
    </svg>
  );
}
