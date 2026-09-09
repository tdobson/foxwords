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

  it('renders Home button and all 5 game links', () => {
    render(<AppShellNav />);

    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /words/i })).toHaveAttribute('href', '/words');
    expect(screen.getByRole('link', { name: /counting/i })).toHaveAttribute('href', '/counting');
    expect(screen.getByRole('link', { name: /clock/i })).toHaveAttribute('href', '/clock');
    expect(screen.getByRole('link', { name: /quiz/i })).toHaveAttribute('href', '/quiz');
    expect(screen.getByRole('link', { name: /rhyme/i })).toHaveAttribute('href', '/rhyme');
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

  it('highlights words route when on /words', () => {
    mockUsePathname.mockReturnValue('/words');
    render(<AppShellNav />);

    const wordsLink = screen.getByRole('link', { name: /words/i });
    expect(wordsLink).toHaveAttribute('aria-current', 'page');
    expect(wordsLink).toHaveAttribute('data-active', 'true');
  });

  it('highlights home button when on /', () => {
    mockUsePathname.mockReturnValue('/');
    render(<AppShellNav />);

    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toHaveAttribute('aria-current', 'page');
    expect(homeLink).toHaveAttribute('data-active', 'true');
  });
});
