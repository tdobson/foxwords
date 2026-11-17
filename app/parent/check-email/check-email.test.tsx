import { MantineProvider } from '@mantine/core';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import CheckEmailPage from './page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const renderPage = () =>
  render(
    <MantineProvider>
      <CheckEmailPage />
    </MantineProvider>
  );

describe('CheckEmailPage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    window.history.pushState({}, '', '/parent/check-email?email=mum%40example.com');
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 202, json: async () => ({}) });
  });

  afterEach(() => {
    jest.useRealTimers();
    window.history.pushState({}, '', '/');
  });

  it('shows the address used and a spam folder hint', async () => {
    renderPage();
    expect(await screen.findByTestId('check-email-address')).toHaveTextContent('mum@example.com');
    expect(screen.getByTestId('check-spam-hint')).toHaveTextContent(/spam or junk folder/i);
  });

  it('offers a way to use a different email', () => {
    renderPage();
    expect(screen.getByTestId('use-different-email-btn')).toHaveAttribute('href', '/parent/login');
  });

  it('resends the link and starts a 30 second cooldown', async () => {
    renderPage();
    const resend = await screen.findByTestId('resend-link-btn');
    fireEvent.click(resend);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/request',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'mum@example.com' }),
        })
      );
    });
    expect(await screen.findByTestId('resend-notice')).toHaveTextContent(/on its way/i);
    expect(screen.getByTestId('resend-link-btn')).toBeDisabled();
    expect(screen.getByTestId('resend-link-btn')).toHaveTextContent('Resend link in 30s');

    for (let i = 0; i < 10; i += 1) {
      act(() => {
        jest.advanceTimersByTime(1_000);
      });
    }
    expect(screen.getByTestId('resend-link-btn')).toHaveTextContent('Resend link in 20s');

    for (let i = 0; i < 20; i += 1) {
      act(() => {
        jest.advanceTimersByTime(1_000);
      });
    }
    expect(screen.getByTestId('resend-link-btn')).toBeEnabled();
    expect(screen.getByTestId('resend-link-btn')).toHaveTextContent('Resend link');
  });

  it('does not send a second resend while cooling down', async () => {
    renderPage();
    fireEvent.click(await screen.findByTestId('resend-link-btn'));
    await screen.findByTestId('resend-notice');
    fireEvent.click(screen.getByTestId('resend-link-btn'));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('hides the resend button when no address is known', async () => {
    window.history.pushState({}, '', '/parent/check-email');
    renderPage();
    expect(screen.queryByTestId('resend-link-btn')).not.toBeInTheDocument();
    expect(screen.getByTestId('use-different-email-btn')).toBeInTheDocument();
  });
});
