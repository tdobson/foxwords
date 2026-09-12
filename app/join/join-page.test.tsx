import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import JoinPage from './page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock ProfileContext
const mockSetProfile = jest.fn();
jest.mock('../../lib/play/profile-context', () => ({
  useProfile: () => ({
    profile: null,
    childName: 'Little Fox',
    words: [],
    audioOverrides: {},
    loading: false,
    error: null,
    setProfile: mockSetProfile,
  }),
}));

describe('JoinPage Component', () => {
  const renderJoinPage = () => {
    return render(
      <MantineProvider>
        <JoinPage />
      </MantineProvider>
    );
  };

  it('renders the title and play instructions', () => {
    renderJoinPage();
    expect(screen.getByText('Join your Foxwords game')).toBeInTheDocument();
    expect(screen.getByText(/Ask a grown-up for your family play code:/i)).toBeInTheDocument();
  });

  it('renders keypad buttons excluding ambiguous characters 0, O, 1, I', () => {
    renderJoinPage();
    // Verify valid characters are present
    expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Z' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '9' })).toBeInTheDocument();

    // Verify ambiguous characters are absent
    expect(screen.queryByRole('button', { name: '0' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'O' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'I' })).not.toBeInTheDocument();
  });

  it('renders control buttons Delete, Clear, and play action', () => {
    renderJoinPage();
    expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /LET'S PLAY!/i })).toBeInTheDocument();
  });
});
