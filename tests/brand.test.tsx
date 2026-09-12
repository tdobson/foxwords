import { render, screen } from '@/test-utils';
import HomePage from '../app/page';

describe('Foxwords Brand and Launcher', () => {
  it('renders Foxwords title heading', () => {
    render(<HomePage />);
    const heading = screen.getByRole('heading', { level: 1, name: /Foxwords/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders Play with a family code launcher control linking to /join', () => {
    render(<HomePage />);
    const joinLink = screen.getByTestId('join-code-button');
    expect(joinLink).toBeInTheDocument();
    expect(joinLink).toHaveAttribute('href', '/join');
    expect(joinLink).toHaveTextContent(/Play with a family code/i);
  });

  it('renders Set up Foxwords launcher control linking to /parent/login', () => {
    render(<HomePage />);
    const parentLink = screen.getByTestId('parent-setup-button');
    expect(parentLink).toBeInTheDocument();
    expect(parentLink).toHaveAttribute('href', '/parent/login');
    expect(parentLink).toHaveTextContent(/Set up Foxwords/i);
  });

  it("renders Try Tim's starter game control linking to /words", () => {
    render(<HomePage />);
    const starterLink = screen.getByTestId('starter-game-button');
    expect(starterLink).toBeInTheDocument();
    expect(starterLink).toHaveAttribute('href', '/words');
    expect(starterLink).toHaveTextContent(/Try Tim's starter game/i);
  });

  it('renders privacy explanation statement', () => {
    render(<HomePage />);
    expect(screen.getByText(/No child account is required to play/i)).toBeInTheDocument();
  });
});
