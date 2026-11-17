import { MantineProvider } from '@mantine/core';
import { render, screen, waitFor } from '@testing-library/react';
import ConnectDevicePage from './page';

jest.mock('next/navigation', () => ({
  useParams: () => ({ profileId: 'prof_1' }),
  useRouter: () => ({ push: jest.fn() }),
}));

describe('ConnectDevicePage', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        profile: { id: 'prof_1', childName: 'Juniper', playCode: '86DJS6', words: [] },
      }),
    }) as jest.Mock;
  });

  const renderPage = () =>
    render(
      <MantineProvider>
        <ConnectDevicePage />
      </MantineProvider>
    );

  it('shows the family code in large, readable form', async () => {
    renderPage();
    expect(await screen.findByTestId('connect-family-code')).toHaveTextContent('8 6 D J S 6');
  });

  it('shows the full play link with a copy button', async () => {
    renderPage();
    const link = await screen.findByTestId('connect-play-link');
    await waitFor(() => {
      expect(link).toHaveTextContent('http://localhost/play/86DJS6');
    });
    expect(link).toHaveAttribute('href', '/play/86DJS6');
    expect(screen.getByTestId('copy-play-link-btn')).toBeEnabled();
  });

  it('renders a QR code of the play link', async () => {
    renderPage();
    const qr = await screen.findByTestId('connect-qr');
    expect(qr).toHaveAttribute('alt', "QR code for Juniper's play link");
    await waitFor(() => {
      expect(qr.getAttribute('src')).toMatch(/^data:image\/svg\+xml/);
    });
  });

  it('offers Open on this device and plain steps for a tablet', async () => {
    renderPage();
    expect(await screen.findByTestId('open-on-device-btn')).toHaveAttribute('href', '/play/86DJS6');
    expect(screen.getByTestId('connect-join-url')).toHaveTextContent('http://localhost/join');
    expect(screen.getByTestId('connect-steps')).toHaveTextContent('86DJS6');
  });
});
