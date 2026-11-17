import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import HomePage from './page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
}));

describe('HomePage', () => {
  const renderHome = () =>
    render(
      <MantineProvider>
        <HomePage />
      </MantineProvider>
    );

  it('explains what Foxwords is for parents', () => {
    renderHome();
    expect(screen.getByText(/sound like the people your child loves/i)).toBeInTheDocument();
  });

  it('offers the two obvious paths', () => {
    renderHome();
    expect(screen.getByTestId('parent-setup-button')).toHaveAttribute('href', '/parent/login');
    expect(screen.getByRole('link', { name: /set up for my child/i })).toBe(
      screen.getByTestId('parent-setup-button')
    );
    expect(screen.getByTestId('join-code-button')).toHaveAttribute('href', '/join');
    expect(screen.getByRole('link', { name: /i have a family code/i })).toBe(
      screen.getByTestId('join-code-button')
    );
  });

  it('keeps a demo game link and no prototype naming', () => {
    const { container } = renderHome();
    expect(screen.getByTestId('demo-game-button')).toHaveAttribute('href', '/words');
    expect(screen.getByRole('link', { name: /try a demo game/i })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/\bTim\b/);
  });
});
