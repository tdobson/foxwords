import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { buildStudioQueue } from '../../../../lib/play/studio-queue';
import ProfileCustomiserPage from './page';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({ profileId: 'prof_1' }),
  useRouter: () => ({ push: mockPush }),
}));

const profileWithWords = (words: unknown[]) => ({
  profile: { id: 'prof_1', childName: 'Leo', playCode: 'LION99', words },
});

function mockApi(words: unknown[], overrides: unknown[]) {
  global.fetch = jest.fn().mockImplementation((url: string, options?: RequestInit) => {
    if (url === '/api/profiles/prof_1' && !options?.method) {
      return Promise.resolve({ ok: true, status: 200, json: async () => profileWithWords(words) });
    }
    if (url === '/api/profiles/prof_1/audio-overrides' && !options?.method) {
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ overrides }) });
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
  }) as jest.Mock;
}

const renderPage = () =>
  render(
    <MantineProvider>
      <ProfileCustomiserPage />
    </MantineProvider>
  );

const expectedTotal = (extraWords: number) => {
  const queue = buildStudioQueue({
    childName: 'Leo',
    siblings: [],
    caregivers: ['Mum', 'Dad', 'Grandad'],
  });
  return new Set(queue.map((item) => item.clipKey)).size + extraWords;
};

describe('ProfileCustomiserPage', () => {
  afterEach(() => {
    mockPush.mockReset();
  });

  it('shows a three step checklist with real recording counts', async () => {
    mockApi(
      [
        {
          id: 'w_mum',
          word: 'MUM',
          category: 'vip',
          prompt_label: 'Mum',
          photo_asset_id: null,
          audio_asset_id: null,
        },
        {
          id: 'w_rover',
          word: 'ROVER',
          category: 'pet',
          prompt_label: 'Rover',
          photo_asset_id: null,
          audio_asset_id: 'as_rover',
        },
      ],
      [{ id: 'ov_1', clip_key: 'word_leo', asset_id: 'as_leo' }]
    );
    renderPage();

    const checklist = await screen.findByTestId('setup-checklist');
    expect(within(checklist).getByText('Family names added')).toBeInTheDocument();
    expect(screen.getByTestId('checklist-step-names-status')).toHaveTextContent('Done');
    // Leo (override) and Rover (custom word audio) are recorded.
    expect(screen.getByTestId('checklist-step-voices')).toHaveTextContent(
      `2 of ${expectedTotal(1)} recorded`
    );
    expect(screen.getByTestId('checklist-step-device')).toHaveTextContent('Playing on a device');
  });

  it('replaces the old override section with recorded voices grouped by chapter', async () => {
    mockApi([], [{ id: 'ov_1', clip_key: 'word_leo', asset_id: 'as_leo' }]);
    renderPage();

    const group = await screen.findByTestId('voice-group-chapter-1');
    expect(within(group).getByText('Family & VIPs')).toBeInTheDocument();
    expect(within(group).getByText('Leo')).toBeInTheDocument();
    expect(screen.queryByText(/Tim/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Custom Voice Overrides/)).not.toBeInTheDocument();
  });

  it('links each recorded voice back into the studio at that prompt', async () => {
    mockApi([], [{ id: 'ov_1', clip_key: 'word_leo', asset_id: 'as_leo' }]);
    renderPage();

    const reRecord = await screen.findByRole('link', { name: 'Record Leo again' });
    expect(reRecord).toHaveAttribute('href', '/parent/profile/prof_1/studio?key=word_leo');
  });

  it('shows an empty voices state and a studio button when nothing is recorded', async () => {
    mockApi([], []);
    renderPage();

    expect(await screen.findByTestId('no-recorded-voices')).toBeInTheDocument();
    expect(screen.getByTestId('checklist-step-voices')).toHaveTextContent('0 of');
    expect(screen.getByTestId('checklist-record-btn')).toHaveAttribute(
      'href',
      '/parent/profile/prof_1/studio'
    );
    expect(screen.getByTestId('checklist-connect-btn')).toHaveAttribute(
      'href',
      '/parent/profile/prof_1/connect'
    );
  });

  it('opens the add name form from the first checklist step', async () => {
    mockApi([], []);
    renderPage();

    fireEvent.click(await screen.findByTestId('checklist-add-names-btn'));
    expect(await screen.findByTestId('add-word-form')).toBeInTheDocument();
  });
});
