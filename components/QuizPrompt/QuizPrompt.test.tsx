import React from 'react';
import { render, screen } from '@/test-utils';
import { QuizPrompt } from './QuizPrompt';
import { LEARNING_WORDS } from '../../constants/learning-words';

describe('QuizPrompt', () => {
  const train = LEARNING_WORDS.find((word) => word.id === 'train')!;

  it('shows the picture with an empty first-letter box', () => {
    render(<QuizPrompt word={train} isCorrect={false} />);
    expect(
      screen.getByRole('region', { name: /what letter does train start with/i })
    ).toBeInTheDocument();
    const blank = screen.getByTestId('quiz-blank');
    expect(blank).toHaveAttribute('data-correct', 'false');
    expect(blank.textContent).toBe('');
    expect(screen.queryByText('T')).not.toBeInTheDocument();
  });

  it('shows the first letter when answered correctly', () => {
    render(<QuizPrompt word={train} isCorrect />);
    const blank = screen.getByTestId('quiz-blank');
    expect(blank).toHaveAttribute('data-correct', 'true');
    expect(blank.textContent).toBe('T');
  });
});
