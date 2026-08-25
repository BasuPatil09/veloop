import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FAQAccordion } from './FAQAccordion';

describe('FAQAccordion', () => {
  it('starts with every answer collapsed', () => {
    render(<FAQAccordion />);
    expect(screen.queryByText(/create an account, open a prize/i)).not.toBeInTheDocument();
  });

  it('expands an answer when its question is clicked, and sets aria-expanded', () => {
    render(<FAQAccordion />);
    const trigger = screen.getByRole('button', { name: /how do i participate/i });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/create an account, open a prize/i)).toBeInTheDocument();
  });

  it('collapses the answer again when the same question is clicked twice', () => {
    render(<FAQAccordion />);
    const trigger = screen.getByRole('button', { name: /how do i participate/i });

    fireEvent.click(trigger);
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/create an account, open a prize/i)).not.toBeInTheDocument();
  });

  it('only shows one answer open at a time', () => {
    render(<FAQAccordion />);
    fireEvent.click(screen.getByRole('button', { name: /how do i participate/i }));
    fireEvent.click(screen.getByRole('button', { name: /how are winners selected/i }));

    expect(screen.queryByText(/create an account, open a prize/i)).not.toBeInTheDocument();
    expect(screen.getByText(/chosen at random from everyone who joined/i)).toBeInTheDocument();
  });
});
