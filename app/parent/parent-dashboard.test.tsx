import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ParentDashboardPage from './page';

const mockPush = jest.fn();
// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('ParentDashboardPage Component', () => {
  beforeEach(() => {
    // Mock fetch for /api/profiles
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url === '/api/profiles') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            profiles: [
              {
                id: 'prof_test123',
                childName: 'Leo',
                playCode: 'LION99',
                createdAt: Date.now(),
                updatedAt: Date.now(),
              },
            ],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      });
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const renderDashboard = () => {
    return render(
      <MantineProvider>
        <ParentDashboardPage />
      </MantineProvider>
    );
  };

  it('renders dashboard heading and sign out button', async () => {
    renderDashboard();
    expect(screen.getByText('Foxwords Parent Space')).toBeInTheDocument();
    expect(screen.getByTestId('logout-btn')).toBeInTheDocument();
    await screen.findByText('Leo');
  });

  it('renders child profile card when profiles load', async () => {
    renderDashboard();
    expect(await screen.findByText('Leo')).toBeInTheDocument();
    expect(screen.getByText('Code: LION99')).toBeInTheDocument();
    expect(screen.getByText('Open Game')).toBeInTheDocument();
    expect(screen.getByText('Voice Studio')).toBeInTheDocument();
    expect(screen.getByText('Customise')).toBeInTheDocument();
    expect(screen.getByText('Connect')).toBeInTheDocument();
  });

  it('redirects directly to /parent/profile/[profileId]/studio upon creating a new child', async () => {
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (url === '/api/profiles' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            profile: {
              id: 'prof_new456',
              childName: 'Maya',
              playCode: 'MAYA12',
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          }),
        });
      }
      if (url === '/api/profiles') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            profiles: [],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      });
    });

    renderDashboard();

    // Click "Add a child" button
    const addBtn = await screen.findByTestId('add-first-child-btn');
    fireEvent.click(addBtn);

    // Enter child name
    const input = await screen.findByTestId('new-child-name-input');
    fireEvent.change(input, { target: { value: 'Maya' } });

    // Submit form
    const submitBtn = screen.getByTestId('confirm-create-child');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/parent/profile/prof_new456/studio');
    });
  });
});
