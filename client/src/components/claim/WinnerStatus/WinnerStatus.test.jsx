import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WinnerStatus } from './WinnerStatus';
import { useAuth } from '../../../hooks/useAuth';
import { useClaim } from '../../../hooks/useClaim';

vi.mock('../../../hooks/useAuth');
vi.mock('../../../hooks/useClaim');

const prize = { id: 'prize-1', name: 'iPhone 15 Pro', claimType: 'PHYSICAL_ADDRESS' };

function renderStatus() {
  return render(
    <MemoryRouter>
      <WinnerStatus prize={prize} />
    </MemoryRouter>,
  );
}

function mockClaim(overrides = {}) {
  useClaim.mockReturnValue({
    isWinner: false,
    winner: null,
    claim: null,
    isLoading: false,
    submitClaim: vi.fn(),
    isSubmitting: false,
    submitError: null,
    ...overrides,
  });
}

describe('WinnerStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('tells an unauthenticated visitor to log in, without revealing win/loss status', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });
    mockClaim();

    renderStatus();
    expect(screen.getByText(/log in to see if you won/i)).toBeInTheDocument();
  });

  it('shows a neutral non-winner message, never the claim form, for a logged-in non-winner', () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    mockClaim({ isWinner: false });

    renderStatus();
    expect(screen.getByText(/didn.t win this time/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /claim your prize/i })).not.toBeInTheDocument();
  });

  it('reveals the winner card, with a claim button, after the brief reveal beat', () => {
    vi.useFakeTimers();
    useAuth.mockReturnValue({ isAuthenticated: true });
    mockClaim({
      isWinner: true,
      winner: { claimDeadline: new Date(Date.now() + 7 * 86400 * 1000) },
      claim: { status: 'NOT_SUBMITTED' },
    });

    renderStatus();
    // Not shown immediately — there's a deliberate single reveal beat, not an instant flash
    expect(screen.queryByText(/congratulations/i)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText(/congratulations! you won iphone 15 pro/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /claim your prize/i })).toBeInTheDocument();
  });

  it('hides the claim button and shows the right badge once already submitted', () => {
    vi.useFakeTimers();
    useAuth.mockReturnValue({ isAuthenticated: true });
    mockClaim({
      isWinner: true,
      winner: { claimDeadline: new Date(Date.now() + 7 * 86400 * 1000) },
      claim: { status: 'SUBMITTED' },
    });

    renderStatus();
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText(/claim submitted/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /claim your prize/i })).not.toBeInTheDocument();
  });

  it('shows "Prize Delivered" for a completed claim', () => {
    vi.useFakeTimers();
    useAuth.mockReturnValue({ isAuthenticated: true });
    mockClaim({
      isWinner: true,
      winner: { claimDeadline: new Date(Date.now() + 7 * 86400 * 1000) },
      claim: { status: 'COMPLETED' },
    });

    renderStatus();
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText(/prize delivered/i)).toBeInTheDocument();
  });
});
