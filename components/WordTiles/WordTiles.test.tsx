import React from 'react';
import { render, screen } from '@/test-utils';
import { WordTiles } from './WordTiles';

describe('WordTiles', () => {
  it('renders JAMES with J completed, A active, and subsequent tiles unfinished', () => {
    render(<WordTiles word="JAMES" nextIndex={1} difficulty="full-outline" />);

    const tileJ = screen.getByTestId('letter-tile-0');
    const tileA = screen.getByTestId('letter-tile-1');
    const tileM = screen.getByTestId('letter-tile-2');

    expect(tileJ).toHaveAttribute('data-state', 'completed');
    expect(tileJ).toHaveAttribute('aria-label', 'Letter J, completed');

    expect(tileA).toHaveAttribute('data-state', 'active');
    expect(tileA).toHaveAttribute('aria-label', 'Letter A, current letter');

    expect(tileM).toHaveAttribute('data-state', 'full-outline');
    expect(tileM).toHaveAttribute('aria-label', 'Letter M, full outline');
  });

  it('renders unfinished letters as full-outline in full-outline mode', () => {
    render(<WordTiles word="CAT" nextIndex={0} difficulty="full-outline" />);

    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'active');
    expect(screen.getByTestId('letter-tile-1')).toHaveAttribute('data-state', 'full-outline');
    expect(screen.getByTestId('letter-tile-1')).toHaveAttribute(
      'aria-label',
      'Letter A, full outline'
    );
    expect(screen.getByTestId('letter-tile-2')).toHaveAttribute('data-state', 'full-outline');
  });

  it('renders unfinished letters as outline in outline mode', () => {
    render(<WordTiles word="CAT" nextIndex={0} difficulty="outline" />);

    expect(screen.getByTestId('letter-tile-1')).toHaveAttribute('data-state', 'outline');
    expect(screen.getByTestId('letter-tile-1')).toHaveAttribute('aria-label', 'Letter A, outline');
  });

  it('renders unfinished letters as faint in faint mode', () => {
    render(<WordTiles word="CAT" nextIndex={0} difficulty="faint" />);

    expect(screen.getByTestId('letter-tile-1')).toHaveAttribute('data-state', 'faint');
    expect(screen.getByTestId('letter-tile-1')).toHaveAttribute('aria-label', 'Letter A, faint');
  });

  it('renders reveal mode letters according to revealCount', () => {
    render(<WordTiles word="CAT" nextIndex={0} difficulty="reveal" revealCount={1} />);

    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'active');
    expect(screen.getByTestId('letter-tile-1')).toHaveAttribute('data-state', 'hidden');
    expect(screen.getByTestId('letter-tile-1')).toHaveAttribute('aria-label', 'Letter A, hidden');
  });

  it('renders revealed letters as faint in reveal mode when revealCount covers them', () => {
    render(<WordTiles word="CAT" nextIndex={0} difficulty="reveal" revealCount={2} />);

    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'active');
    expect(screen.getByTestId('letter-tile-1')).toHaveAttribute('data-state', 'faint');
    expect(screen.getByTestId('letter-tile-2')).toHaveAttribute('data-state', 'hidden');
  });
});
