import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import AuthVerifyPage from '../page';

let mockToken: string | null = null;
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => mockToken }),
}));

const renderPage = () =>
  render(
    <MantineProvider>
      <AuthVerifyPage />
    </MantineProvider>
  );

describe('AuthVerifyPage', () => {
  it('asks the parent to confirm with a POST form instead of signing in on page load', () => {
    mockToken = 'abc123';
    const { container } = renderPage();
    const button = screen.getByTestId('confirm-sign-in-btn');
    expect(button).toHaveAccessibleName('Sign in');
    const form = container.querySelector('form')!;
    expect(form.getAttribute('method')).toBe('post');
    expect(form.getAttribute('action')).toBe('/api/auth/verify');
    expect((form.querySelector('input[name="token"]') as HTMLInputElement).value).toBe('abc123');
  });

  it('shows the expired-link help when there is no token', () => {
    mockToken = null;
    renderPage();
    expect(screen.getByTestId('send-new-link-btn')).toBeInTheDocument();
  });
});
