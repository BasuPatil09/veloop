import { describe, it, expect } from 'vitest';
import { formatEntryFee, currencyLabel, formatStatCount } from './currencyFormatter';

describe('formatEntryFee', () => {
  it('formats VE amounts with the correct plural label', () => {
    expect(formatEntryFee(250, 'VE')).toBe('250 VEs');
  });

  it('formats SVE and TOKEN with their own labels, not a shared/hardcoded one', () => {
    expect(formatEntryFee(500, 'SVE')).toBe('500 SVEs');
    expect(formatEntryFee(2000, 'TOKEN')).toBe('2,000 Tokens');
  });

  it('adds thousands separators for large amounts', () => {
    expect(formatEntryFee(10000, 'TOKEN')).toBe('10,000 Tokens');
  });

  it('falls back to the raw currency code for an unrecognized currency', () => {
    expect(formatEntryFee(5, 'XYZ')).toBe('5 XYZ');
  });
});

describe('currencyLabel', () => {
  it('maps every known currency to its plural label', () => {
    expect(currencyLabel('VE')).toBe('VEs');
    expect(currencyLabel('SVE')).toBe('SVEs');
    expect(currencyLabel('TOKEN')).toBe('Tokens');
  });
});

describe('formatStatCount', () => {
  it('shows small real numbers as-is, without an inflating "+" suffix', () => {
    expect(formatStatCount(0)).toBe('0');
    expect(formatStatCount(2)).toBe('2');
    expect(formatStatCount(999)).toBe('999');
  });

  it('abbreviates thousands with a "+" once the number is genuinely large', () => {
    expect(formatStatCount(1000)).toBe('1K+');
    expect(formatStatCount(8500)).toBe('8.5K+');
  });

  it('abbreviates millions', () => {
    expect(formatStatCount(1200000)).toBe('1.2M+');
  });

  it('renders a dash for missing data rather than 0 or NaN', () => {
    expect(formatStatCount(null)).toBe('—');
    expect(formatStatCount(undefined)).toBe('—');
  });
});
