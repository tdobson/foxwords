import React from 'react';
import { render, screen } from '@/test-utils';
import type { LearningWord } from '../../types/learning-word.types';
import { PromptCard } from './PromptCard';

describe('PromptCard', () => {
  const baseWord: LearningWord = {
    id: 'test-car',
    word: 'CAR',
    promptLabel: 'Car',
    accentColor: '#e53e3e',
    promptImage: '🚗',
    ipa: ['k', 'ɑː'],
  };

  it('renders a single emoji glyph when promptRepeat is not set', () => {
    render(<PromptCard word={baseWord} />);
    const art = screen.getByText('🚗');
    expect(art).toBeInTheDocument();
    expect(art).not.toHaveAttribute('data-multi');
  });

  it('renders repeated emoji glyphs when promptRepeat is greater than 1', () => {
    const multiWord: LearningWord = {
      ...baseWord,
      promptRepeat: 3,
    };
    render(<PromptCard word={multiWord} />);
    const art = screen.getByText('🚗 🚗 🚗');
    expect(art).toBeInTheDocument();
    expect(art).toHaveAttribute('data-multi', 'true');
  });

  it('renders a photo when promptPhoto is provided', () => {
    const photoWord: LearningWord = {
      ...baseWord,
      promptPhoto: '/images/words/car.jpg',
    };
    render(<PromptCard word={photoWord} />);
    const img = screen.getByRole('img', { name: 'Photo of Car' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/images/words/car.jpg');
    expect(screen.queryByText('🚗')).not.toBeInTheDocument();
  });
});
