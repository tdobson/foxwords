import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ParentLoginPage from './page';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('ParentLoginPage Component', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 202,
      json: async () => ({}),
    }) as jest.Mock;
  });

  afterEach(() => {
    mockPush.mockReset();
  });

  const renderPage = () =>
    render(
      <MantineProvider>
        <ParentLoginPage />
      </MantineProvider>
    );

  it('renders heading, description and the email form', () => {
    renderPage();
    expect(screen.getByText('Set up Foxwords')).toBeInTheDocument();
    expect(screen.getByText(/Your email is the key to your family space/i)).toBeInTheDocument();
    expect(screen.getByTestId('parent-login-screen')).toBeInTheDocument();
    expect(screen.getByTestId('submit-login')).toBeInTheDocument();
  });

  it('focuses an email field that is set up for email keyboards', () => {
    renderPage();
    const input = screen.getByTestId('email-input');
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('autocomplete', 'email');
    expect(input).toHaveAttribute('inputmode', 'email');
    expect(input).toHaveAttribute('enterkeyhint', 'go');
  });

  it('requests a link and passes the address to the check-email screen', async () => {
    renderPage();
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: '  mum@example.com ' },
    });
    fireEvent.click(screen.getByTestId('submit-login'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/parent/check-email?email=mum%40example.com');
    });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/request',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'mum@example.com' }),
      })
    );
  });

  it('shows a rate limit message when sign-in is throttled', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({}),
    });
    renderPage();
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'mum@example.com' } });
    fireEvent.click(screen.getByTestId('submit-login'));

    expect(await screen.findByRole('alert')).toHaveTextContent(/too many sign-in attempts/i);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
