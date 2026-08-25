import { describe, it, expect } from 'vitest';
import { getErrorMessage } from './errorMessages';

function apiError(code, message) {
  return { response: { data: { error: { code, message } } } };
}

describe('getErrorMessage', () => {
  it('maps a known error code to its friendly copy', () => {
    expect(getErrorMessage(apiError('ALREADY_PARTICIPATING'))).toBe(
      "You're already participating in this giveaway.",
    );
  });

  it('uses the backend message directly for VALIDATION_ERROR, since it is already user-facing', () => {
    expect(getErrorMessage(apiError('VALIDATION_ERROR', 'Password must be at least 8 characters'))).toBe(
      'Password must be at least 8 characters',
    );
  });

  it('falls back to the provided default when the error has no response body at all', () => {
    expect(getErrorMessage(new Error('network error'), 'Custom fallback')).toBe('Custom fallback');
  });

  it('falls back to the backend message for an unmapped code', () => {
    expect(getErrorMessage(apiError('SOME_UNMAPPED_CODE', 'Backend says this'))).toBe('Backend says this');
  });

  it('never leaks a raw error code or stack trace as the displayed message', () => {
    const message = getErrorMessage(apiError('INTERNAL_ERROR'));
    expect(message).not.toMatch(/Error:/);
    expect(message.length).toBeGreaterThan(0);
  });
});
