// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders a skip to content link', () => {
    render(<App />);
    const skipLink = screen.getByText('Skip to content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');

    // Check for sr-only class (visually hidden by default)
    expect(skipLink).toHaveClass('sr-only');

    // Check for focus classes (visible on focus)
    expect(skipLink).toHaveClass('focus:not-sr-only');
  });

  it('renders the main content area with the correct ID', () => {
    render(<App />);
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
  });
});
