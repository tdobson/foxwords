import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import ParentLoginPage from './page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('ParentLoginPage Component', () => {
  const renderPage = () => {
    return render(
      <MantineProvider>
        <ParentLoginPage />
      </MantineProvider>
    );
  };

  it('renders login heading and description', () => {
    renderPage();
    expect(screen.getByText('Set up Foxwords')).toBeInTheDocument();
    expect(screen.getByText(/Your email is the key to your family space/i)).toBeInTheDocument();
  });

  it('renders email input and magic link submit button', () => {
    renderPage();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-login')).toBeInTheDocument();
  });
});
