import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ParticipationCTA } from './ParticipationCTA';
import { useAuth } from '../../../hooks/useAuth';
import { useParticipation } from '../../../hooks/useParticipation';

vi.mock('../../../hooks/useAuth');
vi.mock('../../../hooks/useParticipation');

const prize = { id: 'prize-1', name: 'Test Prize', entryAmount: 250, entryCurrency: 'VE' };
const activeGiveaway = { status: 'active' };
const upcomingGiveaway = { status: 'upcoming' };

function renderCTA(giveaway = activeGiveaway) {
  return render(
    <MemoryRouter>
      <ParticipationCTA prize={prize} giveaway={giveaway} />
    </MemoryRouter>,
  );
}

function mockParticipation(overrides = {}) {
  useParticipation.mockReturnValue({
    joined: false,
    isStatusLoading: false,
    join: vi.fn(),
    isJoining: false,
    joinError: null,
    resetJoinError: vi.fn(),
    ...overrides,
  });
}

describe('ParticipationCTA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a disabled CTA for an upcoming giveaway, without checking join status', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, user: null });
    mockParticipation();

    renderCTA(upcomingGiveaway);
    expect(screen.getByRole('button', { name: /notify me/i })).toBeDisabled();
  });

  it('opens the Login Required prompt instead of joining, for an unauthenticated visitor', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, user: null });
    const joinMock = vi.fn();
    mockParticipation({ join: joinMock });

    renderCTA();
    fireEvent.click(screen.getByRole('button', { name: /join for 250 ves/i }));

    expect(screen.getByText('Login Required')).toBeInTheDocument();
    expect(joinMock).not.toHaveBeenCalled();
  });

  it('shows a loading indicator while checking whether the user already joined', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, user: { balances: { ve: 1000, sve: 0, token: 0 } } });
    mockParticipation({ isStatusLoading: true });

    renderCTA();
    expect(screen.getByText(/checking your entry/i)).toBeInTheDocument();
  });

  it('shows the "already participating" state once joined, without re-showing the join button', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, user: { balances: { ve: 1000, sve: 0, token: 0 } } });
    mockParticipation({ joined: true });

    renderCTA();
    expect(screen.getByText("You're Already Participating")).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /join for/i })).not.toBeInTheDocument();
  });

  it('opens a confirmation modal rather than joining immediately on the first click', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, user: { balances: { ve: 1000, sve: 0, token: 0 } } });
    const joinMock = vi.fn();
    mockParticipation({ join: joinMock });

    renderCTA();
    fireEvent.click(screen.getByRole('button', { name: /join for 250 ves/i }));

    expect(screen.getByText('Confirm Participation')).toBeInTheDocument();
    expect(joinMock).not.toHaveBeenCalled();
  });

  it('shows the balance and balance-after-joining in the confirmation modal', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, user: { balances: { ve: 850, sve: 0, token: 0 } } });
    mockParticipation();

    renderCTA();
    fireEvent.click(screen.getByRole('button', { name: /join for 250 ves/i }));

    expect(screen.getByText('850 VEs')).toBeInTheDocument(); // current balance
    expect(screen.getByText('600 VEs')).toBeInTheDocument(); // after joining
  });
});
