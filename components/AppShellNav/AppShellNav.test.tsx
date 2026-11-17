import React from 'react';
import { render, screen } from '@/test-utils';
import { AppShellNav } from './AppShellNav';

const mockUsePathname = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('AppShellNav', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
  });

  it('renders Home, the five game links and a Grown-ups link', () => {
    render(<AppShellNav />);

    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /words/i })).toHaveAttribute('href', '/words');
    expect(screen.getByRole('link', { name: /counting/i })).toHaveAttribute('href', '/counting');
    expect(screen.getByRole('link', { name: /clock/i })).toHaveAttribute('href', '/clock');
    expect(screen.getByRole('link', { name: /quiz/i })).toHaveAttribute('href', '/quiz');
    expect(screen.getByRole('link', { name: /rhyme/i })).toHaveAttribute('href', '/rhyme');
    expect(screen.getByTestId('nav-grown-ups')).toHaveAttribute('href', '/parent');
  });

  it('highlights the active route based on usePathname', () => {
    mockUsePathname.mockReturnValue('/clock');
    render(<AppShellNav />);

    const clockLink = screen.getByRole('link', { name: /clock/i });
    expect(clockLink).toHaveAttribute('aria-current', 'page');
    expect(clockLink).toHaveAttribute('data-active', 'true');

    const wordsLink = screen.getByRole('link', { name: /words/i });
    expect(wordsLink).not.toHaveAttribute('aria-current');
    expect(wordsLink).toHaveAttribute('data-active', 'false');
  });

  it('highlights home button when on /', () => {
    mockUsePathname.mockReturnValue('/');
    render(<AppShellNav />);

    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toHaveAttribute('aria-current', 'page');
    expect(homeLink).toHaveAttribute('data-active', 'true');
  });

  it('hides the game tabs on grown-up pages but keeps Home and Grown-ups', () => {
    mockUsePathname.mockReturnValue('/parent/profile/prof_1/connect');
    render(<AppShellNav />);

    expect(screen.queryByTestId('nav-words')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-rhyme')).not.toBeInTheDocument();
    expect(screen.getByTestId('nav-home')).toBeInTheDocument();
    expect(screen.getByTestId('nav-grown-ups')).toHaveAttribute('aria-current', 'page');
  });

  it('renders nothing inside the child play route', () => {
    mockUsePathname.mockReturnValue('/play/ABC123');
    render(<AppShellNav />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
