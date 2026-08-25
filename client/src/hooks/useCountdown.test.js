import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdown } from './useCountdown';

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('computes correct days/hours/minutes/seconds remaining', () => {
    const target = new Date(Date.now() + (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000);
    const { result } = renderHook(() => useCountdown(target));

    expect(result.current).toMatchObject({ days: 2, hours: 3, minutes: 4, seconds: 5, isComplete: false });
  });

  it('counts down as time passes', () => {
    const target = new Date(Date.now() + 5000);
    const { result } = renderHook(() => useCountdown(target));

    expect(result.current.seconds).toBe(5);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.seconds).toBe(2);
    expect(result.current.isComplete).toBe(false);
  });

  it('clamps to zero and reports isComplete once the target passes, never going negative', () => {
    const target = new Date(Date.now() + 2000);
    const { result } = renderHook(() => useCountdown(target));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current).toMatchObject({ days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true });
  });

  it('returns a static zeroed/complete state when given no target date', () => {
    const { result } = renderHook(() => useCountdown(null));
    expect(result.current.isComplete).toBe(true);
  });
});
