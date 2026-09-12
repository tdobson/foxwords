import React from 'react';
import { render, screen } from '@/test-utils';
import { LEARNING_WORDS } from '../../constants/learning-words';
import { CountPrompt } from './CountPrompt';

describe('CountPrompt', () => {
  const cat = LEARNING_WORDS.find((w) => w.id === 'cat')!;

  it('renders 2 items and 1 empty number tile for count 2', () => {
    render(
      <CountPrompt
        word={cat}
        count={2}
        layout="row"
        numberNextIndex={0}
        hintRevealed={false}
        isCorrect={false}
      />
    );

    const items = screen.getAllByTestId('count-item');
    expect(items).toHaveLength(2);

    const tile = screen.getByTestId('number-tile-0');
    expect(tile).toHaveAttribute('data-state', 'hidden');
    expect(tile.textContent).toBe('');
  });

  it('reveals faint glyph hint when hintRevealed is true and not yet typed', () => {
    render(
      <CountPrompt
        word={cat}
        count={2}
        layout="row"
        numberNextIndex={0}
        hintRevealed
        isCorrect={false}
      />
    );

    const tile = screen.getByTestId('number-tile-0');
    expect(tile).toHaveAttribute('data-state', 'faint');
    expect(tile.textContent).toBe('2');
  });

  it('renders 2 tiles for count 12 and tens-and-ones grouping', () => {
    render(
      <CountPrompt
        word={cat}
        count={12}
        layout="tens"
        numberNextIndex={1}
        hintRevealed={false}
        isCorrect={false}
      />
    );

    const items = screen.getAllByTestId('count-item');
    expect(items).toHaveLength(12);

    expect(screen.getByTestId('tens-group-0')).toBeInTheDocument();
    expect(screen.getByTestId('ones-group')).toBeInTheDocument();

    const tile0 = screen.getByTestId('number-tile-0');
    const tile1 = screen.getByTestId('number-tile-1');
    expect(tile0).toHaveAttribute('data-state', 'completed');
    expect(tile0.textContent).toBe('1');
    expect(tile1).toHaveAttribute('data-state', 'hidden');
    expect(tile1.textContent).toBe('');
  });

  it('displays completed tiles when isCorrect is true', () => {
    render(
      <CountPrompt
        word={cat}
        count={2}
        layout="row"
        numberNextIndex={1}
        hintRevealed={false}
        isCorrect
      />
    );

    const tile = screen.getByTestId('number-tile-0');
    expect(tile).toHaveAttribute('data-state', 'completed');
    expect(tile.textContent).toBe('2');
  });

  it('renders grid layout correctly', () => {
    render(
      <CountPrompt
        word={cat}
        count={6}
        layout="grid"
        numberNextIndex={0}
        hintRevealed={false}
        isCorrect={false}
      />
    );

    const items = screen.getAllByTestId('count-item');
    expect(items).toHaveLength(6);
  });

  it('renders promptImage fallback if promptPhoto is not present', () => {
    const wordWithoutPhoto = { ...cat, promptPhoto: undefined, promptImage: '🐱' };
    render(
      <CountPrompt
        word={wordWithoutPhoto}
        count={1}
        layout="row"
        numberNextIndex={0}
        hintRevealed={false}
        isCorrect={false}
      />
    );

    expect(screen.getByText('🐱')).toBeInTheDocument();
  });
});
