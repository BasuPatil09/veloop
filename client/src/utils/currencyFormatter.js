const CURRENCY_LABELS = { VE: 'VEs', SVE: 'SVEs', TOKEN: 'Tokens' };

/** Formats an entry fee like "250 VEs" — the label always comes from data, never hardcoded per-prize. */
export function formatEntryFee(amount, currency) {
  const label = CURRENCY_LABELS[currency] || currency;
  return `${Number(amount).toLocaleString()} ${label}`;
}

export function currencyLabel(currency) {
  return CURRENCY_LABELS[currency] || currency;
}

/**
 * Formats a stat count honestly: real small numbers show as-is (no "2+" nonsense),
 * only genuinely large numbers get the rounded "K+"/"M+" marketing treatment.
 */
export function formatStatCount(value) {
  if (value == null) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M+`;
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K+`;
  return String(value);
}
