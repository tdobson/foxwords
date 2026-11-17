import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ParentDashboardPage from './page';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const leoProfile = {
  id: 'prof_test123',
  childName: 'Leo',
  playCode: 'LION99',
  playUrl: '/play/LION99',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

function mockProfiles(profiles: unknown[]) {
  global.fetch = jest.fn().mockImplementation((url: string, options?: RequestInit) => {
    if (url === '/api/profiles' && options?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        status: 201,
        json: async () => ({
          profile: { ...leoProfile, id: 'prof_new456', childName: 'Maya', playCode: 'MAYA12' },
        }),
      });
    }
    if (url === '/api/profiles') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ profiles }),
      });
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
  }) as jest.Mock;
}

const renderDashboard = () =>
  render(
    <MantineProvider>
      <ParentDashboardPage />
    </MantineProvider>
  );

describe('ParentDashboardPage', () => {
  afterEach(() => {
    mockPush.mockReset();
  });

  describe('first-time parent with no children', () => {
    beforeEach(() => mockProfiles([]));

    it('shows the single friendly name step inline and focuses it', async () => {
      renderDashboard();

      const input = await screen.findByTestId('child-name-input');
      expect(screen.getByLabelText(/What's your child's first name/)).toBe(input);
      expect(input).toHaveFocus();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('sends the name to the studio after submitting', async () => {
      renderDashboard();

      const input = await screen.findByTestId('child-name-input');
      fireEvent.change(input, { target: { value: '  Maya  ' } });
      fireEvent.click(screen.getByTestId('child-name-submit'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/parent/profile/prof_new456/studio');
      });
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/profiles',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ childName: 'Maya' }) })
      );
    });

    it('keeps the submit button disabled until a name is typed', async () => {
      renderDashboard();

      const submit = await screen.findByTestId('child-name-submit');
      expect(submit).toBeDisabled();
      fireEvent.change(screen.getByTestId('child-name-input'), { target: { value: 'Ava' } });
      expect(submit).toBeEnabled();
    });
  });

  describe('returning parent with a child', () => {
    beforeEach(() => mockProfiles([leoProfile]));

    it('shows the child in natural case with a play code', async () => {
      renderDashboard();

      expect(await screen.findByText('Leo')).toBeInTheDocument();
      expect(screen.getByText('Code LION99')).toBeInTheDocument();
      expect(screen.queryByTestId('child-name-input')).not.toBeInTheDocument();
    });

    it('offers Play now, Record voices, Customise and Connect a device on each card', async () => {
      renderDashboard();

      const card = (await screen.findByTestId('child-card')) as HTMLElement;
      const scope = within(card);
      expect(scope.getByTestId('play-now-btn')).toHaveAttribute('href', '/play/LION99');
      expect(scope.getByTestId('record-voices-btn')).toHaveAttribute(
        'href',
        '/parent/profile/prof_test123/studio'
      );
      expect(scope.getByTestId('customise-btn')).toHaveAttribute(
        'href',
        '/parent/profile/prof_test123'
      );
      expect(scope.getByTestId('connect-device-btn')).toHaveAttribute(
        'href',
        '/parent/profile/prof_test123/connect'
      );
    });

    it('opens an inline name form for another child instead of a modal', async () => {
      renderDashboard();

      fireEvent.click(await screen.findByTestId('add-child-btn'));
      const input = await screen.findByTestId('child-name-input');
      expect(input).toHaveFocus();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('shows a sign out button', async () => {
    mockProfiles([leoProfile]);
    renderDashboard();
    expect(screen.getByTestId('logout-btn')).toBeInTheDocument();
    await screen.findByText('Leo');
  });
});
