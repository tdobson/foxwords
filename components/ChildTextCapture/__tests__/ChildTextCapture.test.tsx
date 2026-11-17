import { fireEvent, render, screen } from '@testing-library/react';
import { ChildTextCapture } from '../ChildTextCapture';

function fireBeforeInput(element: HTMLElement, inputType: string) {
  const event = new Event('beforeinput', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'inputType', { value: inputType });
  element.dispatchEvent(event);
}

describe('ChildTextCapture', () => {
  it('renders a large tap target and a focusable hidden input', () => {
    render(<ChildTextCapture onChar={() => {}} onBackspace={() => {}} />);

    expect(screen.getByTestId('child-type-target')).toHaveTextContent('Tap here to type');
    const input = screen.getByTestId('child-type-input');
    expect(input).toHaveAccessibleName('Type letters');
    expect(input).toHaveAttribute('autocapitalize', 'characters');
    expect(input).toHaveAttribute('autocorrect', 'off');
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(input).toHaveAttribute('spellcheck', 'false');
    expect(input).toHaveAttribute('enterkeyhint', 'next');
    expect(input).toHaveAttribute('inputmode', 'text');
  });

  it('focuses the hidden input when the tap target is tapped', () => {
    render(<ChildTextCapture onChar={() => {}} onBackspace={() => {}} />);

    fireEvent.click(screen.getByTestId('child-type-target'));

    expect(screen.getByTestId('child-type-input')).toHaveFocus();
  });

  it('calls onChar in order and clears the field after each input event', () => {
    const onChar = jest.fn();
    render(<ChildTextCapture onChar={onChar} onBackspace={() => {}} />);
    const input = screen.getByTestId('child-type-input') as HTMLInputElement;

    fireEvent.input(input, { target: { value: 'c' } });
    expect(input.value).toBe('');
    fireEvent.input(input, { target: { value: 'a' } });
    fireEvent.input(input, { target: { value: 't' } });

    expect(onChar.mock.calls).toEqual([['c'], ['a'], ['t']]);
    expect(input.value).toBe('');
  });

  it('splits a multi-character insert into one onChar call per character', () => {
    const onChar = jest.fn();
    render(<ChildTextCapture onChar={onChar} onBackspace={() => {}} />);

    fireEvent.input(screen.getByTestId('child-type-input'), { target: { value: 'dog' } });

    expect(onChar.mock.calls).toEqual([['d'], ['o'], ['g']]);
  });

  it('ignores spaces typed by predictive text', () => {
    const onChar = jest.fn();
    render(<ChildTextCapture onChar={onChar} onBackspace={() => {}} />);

    fireEvent.input(screen.getByTestId('child-type-input'), { target: { value: 'a ' } });

    expect(onChar.mock.calls).toEqual([['a']]);
  });

  it('calls onBackspace for a native delete (beforeinput deleteContentBackward)', () => {
    const onBackspace = jest.fn();
    render(<ChildTextCapture onChar={() => {}} onBackspace={onBackspace} />);

    fireBeforeInput(screen.getByTestId('child-type-input'), 'deleteContentBackward');

    expect(onBackspace).toHaveBeenCalledTimes(1);
  });

  it('does not call onBackspace for inserted text', () => {
    const onBackspace = jest.fn();
    render(<ChildTextCapture onChar={() => {}} onBackspace={onBackspace} />);

    fireBeforeInput(screen.getByTestId('child-type-input'), 'insertText');

    expect(onBackspace).not.toHaveBeenCalled();
  });

  it('waits for composition to finish before reading characters', () => {
    const onChar = jest.fn();
    render(<ChildTextCapture onChar={onChar} onBackspace={() => {}} />);
    const input = screen.getByTestId('child-type-input') as HTMLInputElement;

    const composing = new Event('input', { bubbles: true });
    Object.defineProperty(composing, 'isComposing', { value: true });
    input.value = 'sh';
    input.dispatchEvent(composing);
    expect(onChar).not.toHaveBeenCalled();
    expect(input.value).toBe('sh');

    fireEvent.compositionEnd(input, { target: { value: 'sh' } });

    expect(onChar.mock.calls).toEqual([['s'], ['h']]);
    expect(input.value).toBe('');
  });

  it('only forwards digits in numeric mode', () => {
    const onChar = jest.fn();
    render(<ChildTextCapture onChar={onChar} onBackspace={() => {}} numeric />);
    const input = screen.getByTestId('child-type-input');

    fireEvent.input(input, { target: { value: '4x2' } });

    expect(onChar.mock.calls).toEqual([['4'], ['2']]);
    expect(input).toHaveAttribute('inputmode', 'numeric');
  });

  it('uses the latest callbacks after a re-render', () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = render(<ChildTextCapture onChar={first} onBackspace={() => {}} />);
    rerender(<ChildTextCapture onChar={second} onBackspace={() => {}} />);

    fireEvent.input(screen.getByTestId('child-type-input'), { target: { value: 'z' } });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('z');
  });
});
