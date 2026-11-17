import { render, screen } from '@/test-utils';
import HomePage from '../app/page';

describe('Foxwords Brand and Launcher', () => {
  it('renders Foxwords title heading', () => {
    render(<HomePage />);
    const heading = screen.getByRole('heading', { level: 1, name: /Foxwords/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders the family code launcher control linking to /join', () => {
    render(<HomePage />);
    const joinLink = screen.getByTestId('join-code-button');
    expect(joinLink).toBeInTheDocument();
    expect(joinLink).toHaveAttribute('href', '/join');
    expect(joinLink).toHaveTextContent(/I have a family code/i);
  });

  it('renders the parent set-up launcher control linking to /parent/login', () => {
    render(<HomePage />);
    const parentLink = screen.getByTestId('parent-setup-button');
    expect(parentLink).toBeInTheDocument();
    expect(parentLink).toHaveAttribute('href', '/parent/login');
    expect(parentLink).toHaveTextContent(/Set up for my child/i);
  });

  it('renders a demo game link to /words with no family names', () => {
    render(<HomePage />);
    const demoLink = screen.getByTestId('demo-game-button');
    expect(demoLink).toHaveAttribute('href', '/words');
    expect(demoLink).toHaveTextContent(/Try a demo game/i);
    expect(document.body).not.toHaveTextContent(/\b(Tim|James|Sarah)\b/);
  });

  it('renders privacy explanation statement', () => {
    render(<HomePage />);
    expect(screen.getByText(/Children never need an account/i)).toBeInTheDocument();
  });
});
