import React from 'react';
import { render, screen } from '@/test-utils';
import { WordTiles } from './WordTiles';

describe('WordTiles', () => {
  it('renders JAMES with J completed, A active, and subsequent tiles unfinished', () => {
    render(<WordTiles word="JAMES" nextIndex={1} difficulty="faint" />);

    const tileJ = screen.getByTestId('letter-tile-0');
    const tileA = screen.getByTestId('letter-tile-1');
    const tileM = screen.getByTestId('letter-tile-2');

    expect(tileJ).toHaveAttribute('data-state', 'completed');
    expect(tileJ).toHaveAttribute('aria-label', 'Letter J, completed');

    expect(tileA).toHaveAttribute('data-state', 'active');
    expect(tileA).toHaveAttribute('aria-label', 'Letter A, current letter');

    expect(tileM).toHaveAttribute('data-state', 'faint');
    expect(tileM).toHaveAttribute('aria-label', 'Letter M, faint');
  });

  it('renders unfinished letters as faint in faint mode', () => {
    render(<WordTiles word="CAT" nextIndex={0} difficulty="faint" />);

    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'active');
    expect(screen.getByTestId('letter-tile-1')).toHaveAttribute('data-state', 'faint');
    expect(screen.getByTestId('letter-tile-1')).toHaveAttribute('aria-label', 'Letter A, faint');
    expect(screen.getByTestId('letter-tile-2')).toHaveAttribute('data-state', 'faint');
  });

  it('renders reveal mode with only the current letter visible', () => {
    render(<WordTiles word="CAT" nextIndex={0} difficulty="reveal" />);

    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'active');
    expect(screen.getByTestId('letter-tile-1')).toHaveAttribute('data-state', 'hidden');
    expect(screen.getByTestId('letter-tile-1')).toHaveAttribute('aria-label', 'Letter A, hidden');
    expect(screen.getByTestId('letter-tile-2')).toHaveAttribute('data-state', 'hidden');
  });

  it('reveals the next letter only when the previous one completes', () => {
    render(<WordTiles word="CAT" nextIndex={1} difficulty="reveal" />);

    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'completed');
    expect(screen.getByTestId('letter-tile-1')).toHaveAttribute('data-state', 'active');
    expect(screen.getByTestId('letter-tile-2')).toHaveAttribute('data-state', 'hidden');
  });
});
