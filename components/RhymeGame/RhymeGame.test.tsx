import React from 'react';
import { act, fireEvent, render, screen } from '@/test-utils';
import { RhymeGame } from './RhymeGame';

const mockPlayWord = jest.fn();
const mockAudio = {
  playClip: jest.fn(),
  playWord: mockPlayWord,
  playSequence: jest.fn(),
};

jest.mock('../../lib/audio/clips', () => ({
  usePlayAudio: () => mockAudio,
}));

function completeQuestion(side: 'left' | 'right') {
  fireEvent.keyDown(window, { key: side === 'left' ? 'ArrowLeft' : 'ArrowRight' });
  act(() => {
    jest.advanceTimersByTime(1200);
  });
}

describe('RhymeGame', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders question 1 with the target word and both options', () => {
    render(<RhymeGame />);

    expect(screen.getByRole('region', { name: /what rhymes with cat/i })).toBeInTheDocument();
    expect(screen.getByText(/what rhymes with cat/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose hat/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose dog/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /replay sound/i })).toBeInTheDocument();
    expect(screen.getByText(/\[ ← or H \]/i)).toBeInTheDocument();
    expect(screen.getByText(/\[ → or D \]/i)).toBeInTheDocument();
  });

  it('selects the left card with the left arrow key', () => {
    jest.useFakeTimers();
    render(<RhymeGame />);

    fireEvent.keyDown(window, { key: 'ArrowLeft' });

    expect(screen.getByTestId('rhyme-choice-left')).toHaveAttribute('data-correct', 'true');
    expect(mockPlayWord).toHaveBeenCalledWith(expect.objectContaining({ id: 'hat' }));
  });

  it('selects the right card with the right arrow key', () => {
    render(<RhymeGame />);

    fireEvent.keyDown(window, { key: 'ArrowRight' });

    expect(screen.getByTestId('rhyme-choice-right')).toHaveAttribute('data-wrong', 'true');
    expect(screen.getByRole('region', { name: /what rhymes with cat/i })).toBeInTheDocument();
  });

  it('selects cards with the option first-letter keys', () => {
    jest.useFakeTimers();
    render(<RhymeGame />);

    fireEvent.keyDown(window, { key: 'h' });
    expect(screen.getByTestId('rhyme-choice-left')).toHaveAttribute('data-correct', 'true');

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    fireEvent.keyDown(window, { key: 'b' });
    expect(screen.getByTestId('rhyme-choice-left')).toHaveAttribute('data-wrong', 'true');
  });

  it('shakes on an incorrect selection and allows an immediate retry', () => {
    jest.useFakeTimers();
    render(<RhymeGame />);

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByTestId('rhyme-choice-right')).toHaveAttribute('data-wrong', 'true');

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByTestId('rhyme-choice-left')).toHaveAttribute('data-correct', 'true');
    expect(screen.getByTestId('rhyme-choice-right')).not.toHaveAttribute('data-wrong', 'true');

    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(screen.getByRole('region', { name: /what rhymes with cat/i })).toBeInTheDocument();
  });

  it('advances to the next question after a correct selection', () => {
    jest.useFakeTimers();
    render(<RhymeGame />);

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(mockPlayWord).toHaveBeenCalledWith(expect.objectContaining({ id: 'hat' }));

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    expect(screen.getByRole('region', { name: /what rhymes with frog/i })).toBeInTheDocument();
  });

  it('shows a fireworks toast when a level is completed', () => {
    jest.useFakeTimers();
    render(<RhymeGame />);

    completeQuestion('left');
    completeQuestion('right');
    completeQuestion('left');
    completeQuestion('right');
    completeQuestion('left');
    completeQuestion('right');

    expect(screen.getByRole('status')).toHaveTextContent(/level 1 complete/i);
    expect(screen.getByRole('region', { name: /what rhymes with train/i })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1200);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
