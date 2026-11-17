import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import ParentVoiceStudioPage from '../page';

const mockRouter = { push: jest.fn() };
jest.mock('next/navigation', () => ({
  useParams: () => ({ profileId: 'prof_test' }),
  useRouter: () => mockRouter,
}));

type Responder = (url: string, init?: RequestInit) => { ok: boolean; body?: unknown };

interface FetchOptions {
  assetOk?: () => boolean;
  itemsOk?: boolean;
}

function installFetch(options: FetchOptions = {}) {
  const calls: Array<{ url: string; method: string; body?: any }> = [];
  let assetCounter = 0;
  const respond: Responder = (url, init) => {
    const method = init?.method ?? 'GET';
    if (url.endsWith('/audio-overrides') && method === 'GET') {
      return { ok: true, body: { overrides: [] } };
    }
    if (url.endsWith('/audio-overrides') && method === 'PUT') {
      return { ok: true, body: { override: {} } };
    }
    if (url.endsWith('/assets') && method === 'POST') {
      const ok = options.assetOk ? options.assetOk() : true;
      assetCounter += 1;
      return ok
        ? { ok: true, body: { asset: { id: `ast_${assetCounter}` } } }
        : { ok: false, body: {} };
    }
    if (url.endsWith('/items') && method === 'POST') {
      return { ok: options.itemsOk ?? true, body: { item: {} } };
    }
    if (url === '/api/profiles/prof_test') {
      return {
        ok: true,
        body: { profile: { id: 'prof_test', childName: 'Leo', playCode: 'LEO482', words: [] } },
      };
    }
    return { ok: false, body: {} };
  };

  global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    let body: any;
    if (typeof init?.body === 'string') body = JSON.parse(init.body);
    calls.push({ url, method, body });
    const res = respond(url, init);
    return {
      ok: res.ok,
      status: res.ok ? 200 : 500,
      json: async () => res.body,
    } as Response;
  }) as any;

  return calls;
}

class MockMediaRecorder {
  static instances: MockMediaRecorder[] = [];
  state: 'inactive' | 'recording' = 'inactive';
  mimeType = 'audio/webm';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor() {
    MockMediaRecorder.instances.push(this);
  }
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['x'], { type: 'audio/webm' }) });
    this.onstop?.();
  }
}

function setMic(getUserMedia: jest.Mock) {
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: { getUserMedia },
    configurable: true,
  });
}

function renderStudio() {
  return render(
    <MantineProvider>
      <ParentVoiceStudioPage />
    </MantineProvider>
  );
}

async function enterStudio() {
  renderStudio();
  await screen.findByRole('button', { name: 'Continue' });
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByTestId('prompt-card');
}

describe('Voice studio', () => {
  beforeEach(() => {
    MockMediaRecorder.instances = [];
    (global as any).MediaRecorder = MockMediaRecorder;
    setMic(jest.fn().mockResolvedValue({ getTracks: () => [{ stop: jest.fn() }] }));
  });

  describe('family step', () => {
    it('asks who is in the family, in natural case, with Mummy and Daddy preselected', async () => {
      installFetch();
      renderStudio();
      expect(await screen.findByText("Who's in Leo's family?")).toBeInTheDocument();
      expect(screen.getByLabelText("Child's name")).toHaveValue('Leo');
      expect(screen.getByRole('checkbox', { name: 'Mummy' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Daddy' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Grandma' })).not.toBeChecked();
    });

    it('adds a sibling with the Add button and shows it in the list', async () => {
      installFetch();
      renderStudio();
      await screen.findByText("Who's in Leo's family?");
      fireEvent.change(screen.getByLabelText("Brother or sister's name"), {
        target: { value: 'Maya' },
      });
      fireEvent.click(screen.getByTestId('add-sibling'));
      const list = screen.getByTestId('sibling-list');
      expect(within(list).getByText('Maya')).toBeInTheDocument();
    });

    it('adds a sibling when the form is submitted from the keyboard (Enter)', async () => {
      installFetch();
      renderStudio();
      await screen.findByText("Who's in Leo's family?");
      const input = screen.getByLabelText("Brother or sister's name");
      fireEvent.change(input, { target: { value: 'Finn' } });
      fireEvent.submit(input.closest('form') as HTMLFormElement);
      expect(within(screen.getByTestId('sibling-list')).getByText('Finn')).toBeInTheDocument();
      expect(input).toHaveValue('');
    });

    it('saves every family name as a word on Continue, then opens the studio', async () => {
      const calls = installFetch();
      renderStudio();
      await screen.findByText("Who's in Leo's family?");
      fireEvent.click(screen.getByRole('checkbox', { name: 'Grandma' }));
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      await screen.findByTestId('prompt-card');

      const saved = calls
        .filter((c) => c.url === '/api/profiles/prof_test/items' && c.method === 'POST')
        .map((c) => c.body.word);
      expect(saved).toEqual(['Leo', 'Mummy', 'Daddy', 'Grandma']);
      expect(screen.getByTestId('recorded-count')).toHaveTextContent('0 of');
    });
  });

  describe('recording', () => {
    it('record, keep, next: advances and counts the recording', async () => {
      installFetch();
      await enterStudio();
      expect(screen.getByTestId('prompt-word')).toHaveTextContent('Leo');
      expect(screen.getByTestId('recorded-count')).toHaveTextContent(/^0 of \d+ recorded$/);

      fireEvent.click(screen.getByRole('button', { name: 'Record' }));
      await screen.findByRole('button', { name: 'Stop recording' });
      fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }));

      fireEvent.click(await screen.findByRole('button', { name: 'Keep and next (Enter)' }));

      await waitFor(() => {
        expect(screen.getByTestId('prompt-word')).toHaveTextContent('Mummy');
      });
      expect(screen.getByTestId('last-saved')).toHaveTextContent('Saved Leo');
      expect(screen.getByTestId('recorded-count')).toHaveTextContent(/^1 of \d+ recorded$/);
    });

    it('a failed upload shows Retry, does not count the recording, and Retry then succeeds', async () => {
      let failNext = true;
      installFetch({
        assetOk: () => {
          const ok = !failNext;
          failNext = false;
          return ok;
        },
      });
      await enterStudio();

      fireEvent.click(screen.getByRole('button', { name: 'Record' }));
      await screen.findByRole('button', { name: 'Stop recording' });
      fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }));
      fireEvent.click(await screen.findByRole('button', { name: 'Keep and next (Enter)' }));

      const retry = await screen.findByRole('button', { name: 'Retry' });
      expect(screen.getByRole('alert')).toHaveTextContent(/did not save/i);
      expect(screen.getByTestId('prompt-word')).toHaveTextContent('Leo');
      expect(screen.getByTestId('recorded-count')).toHaveTextContent(/^0 of \d+ recorded$/);

      fireEvent.click(retry);
      await waitFor(() => {
        expect(screen.getByTestId('prompt-word')).toHaveTextContent('Mummy');
      });
      expect(screen.getByTestId('recorded-count')).toHaveTextContent(/^1 of \d+ recorded$/);
    });

    it('shows plain help when the microphone is denied, with a Try again button', async () => {
      installFetch();
      await enterStudio();
      setMic(
        jest.fn().mockRejectedValue(Object.assign(new Error('nope'), { name: 'NotAllowedError' }))
      );

      fireEvent.click(screen.getByRole('button', { name: 'Record' }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Foxwords cannot use your microphone');
      expect(alert).toHaveTextContent(/Chrome/);
      expect(alert).toHaveTextContent(/Safari/);
      expect(alert).toHaveTextContent(/iPad/);
      expect(within(alert).getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    });

    it('skip moves on without counting', async () => {
      installFetch();
      await enterStudio();
      fireEvent.click(screen.getByRole('button', { name: 'Skip this one' }));
      await waitFor(() => {
        expect(screen.getByTestId('prompt-word')).toHaveTextContent('Mummy');
      });
      expect(screen.getByTestId('recorded-count')).toHaveTextContent(/^0 of \d+ recorded$/);
    });
  });

  describe('finish', () => {
    it('shows the family code and the play, connect and dashboard links once chapter 1 is done', async () => {
      installFetch();
      await enterStudio();
      expect(screen.queryByRole('button', { name: "I'll finish later" })).not.toBeInTheDocument();

      // Skip the three family prompts (Leo, Mummy, Daddy)
      for (let i = 0; i < 3; i += 1) {
        fireEvent.click(screen.getByRole('button', { name: 'Skip this one' }));
        await waitFor(() => expect(screen.getByTestId('prompt-card')).toBeInTheDocument());
      }

      fireEvent.click(await screen.findByRole('button', { name: "I'll finish later" }));

      expect(await screen.findByText('Leo is ready to play!')).toBeInTheDocument();
      expect(screen.getByTestId('play-code')).toHaveTextContent('LEO482');
      expect(screen.getByRole('link', { name: 'Play now on this device' })).toHaveAttribute(
        'href',
        '/play/LEO482'
      );
      expect(screen.getByRole('link', { name: 'Connect a tablet' })).toHaveAttribute(
        'href',
        '/parent/profile/prof_test/connect'
      );
      expect(screen.getByRole('link', { name: 'Back to dashboard' })).toHaveAttribute(
        'href',
        '/parent'
      );
    });
  });
});
