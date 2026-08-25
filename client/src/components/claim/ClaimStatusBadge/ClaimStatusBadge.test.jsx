import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClaimStatusBadge } from './ClaimStatusBadge';

describe('ClaimStatusBadge', () => {
  it('renders nothing for NOT_SUBMITTED — the Claim button is the indicator at that stage', () => {
    const { container } = render(<ClaimStatusBadge status="NOT_SUBMITTED" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for an unrecognized/undefined status rather than crashing', () => {
    const { container } = render(<ClaimStatusBadge status={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    ['SUBMITTED', /claim submitted/i],
    ['PROCESSING', /verification in progress/i],
    ['COMPLETED', /prize delivered/i],
    ['EXPIRED', /claim window expired/i],
  ])('shows the correct label for %s', (status, expectedText) => {
    render(<ClaimStatusBadge status={status} />);
    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });
});
