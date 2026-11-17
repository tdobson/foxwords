import { fireEvent, render, screen } from '@testing-library/react';
import { ChildKeyboard } from '../ChildKeyboard';

describe('ChildKeyboard', () => {
  it('renders A to Z with accessible names and a delete key', () => {
    render(<ChildKeyboard onChar={() => {}} onBackspace={() => {}} />);

    for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')) {
      expect(screen.getByRole('button', { name: letter })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '0' })).not.toBeInTheDocument();
  });

  it('calls onChar with the letter tapped', () => {
    const onChar = jest.fn();
    render(<ChildKeyboard onChar={onChar} onBackspace={() => {}} />);

    fireEvent.click(screen.getByTestId('child-key-M'));

    expect(onChar).toHaveBeenCalledWith('M');
  });

  it('calls onBackspace from the delete key', () => {
    const onBackspace = jest.fn();
    render(<ChildKeyboard onChar={() => {}} onBackspace={onBackspace} />);

    fireEvent.click(screen.getByTestId('child-key-backspace'));

    expect(onBackspace).toHaveBeenCalledTimes(1);
  });

  it('renders digits 0 to 9 in numeric mode', () => {
    const onChar = jest.fn();
    render(<ChildKeyboard onChar={onChar} onBackspace={() => {}} numeric />);

    expect(screen.getByRole('group', { name: 'Number keypad' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'A' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '7' }));
    expect(onChar).toHaveBeenCalledWith('7');
  });

  it('marks the expected next letter', () => {
    render(<ChildKeyboard onChar={() => {}} onBackspace={() => {}} highlight="q" />);

    expect(screen.getByTestId('child-key-Q')).toHaveAttribute('data-highlighted', 'true');
    expect(screen.getByTestId('child-key-A')).not.toHaveAttribute('data-highlighted');
  });
});
