import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import ParentDashboardPage from './page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
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
    expect(screen.getByText('Customise')).toBeInTheDocument();
    expect(screen.getByText('Connect')).toBeInTheDocument();
  });
});
