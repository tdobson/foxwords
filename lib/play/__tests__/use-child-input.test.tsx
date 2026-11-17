import { fireEvent, render, screen } from '@testing-library/react';
import { type InputMode, useInputMode } from '../../device/input-mode';
import { type ChildInput, useChildInput } from '../use-child-input';

jest.mock('../../device/input-mode', () => ({
  ...jest.requireActual('../../device/input-mode'),
  useInputMode: jest.fn(() => 'hardware'),
}));

const mockedUseInputMode = useInputMode as jest.MockedFunction<typeof useInputMode>;

function Harness({
  onChar,
  onBackspace,
  numeric,
  highlight,
  onResult,
}: {
  onChar: (char: string) => void;
  onBackspace: () => void;
  numeric?: boolean;
  highlight?: string;
  onResult?: (result: ChildInput) => void;
}) {
  const result = useChildInput({ onChar, onBackspace, numeric, highlight });
  onResult?.(result);
  return <div>{result.inputElement}</div>;
}

function modeOf(mode: InputMode) {
  mockedUseInputMode.mockReturnValue(mode);
}

describe('useChildInput', () => {
  beforeEach(() => {
    modeOf('hardware');
  });

  it('renders nothing extra on a hardware keyboard device', () => {
    render(<Harness onChar={() => {}} onBackspace={() => {}} />);

    expect(screen.queryByTestId('child-type-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('child-keyboard')).not.toBeInTheDocument();
  });

  it('renders the hidden text capture on native touch', () => {
    modeOf('native-touch');
    render(<Harness onChar={() => {}} onBackspace={() => {}} />);

    expect(screen.getByTestId('child-type-target')).toBeInTheDocument();
    expect(screen.getByTestId('child-type-input')).toBeInTheDocument();
    expect(screen.queryByTestId('child-keyboard')).not.toBeInTheDocument();
  });

  it('renders the on-screen keypad on onscreen-keypad devices', () => {
    modeOf('onscreen-keypad');
    render(<Harness onChar={() => {}} onBackspace={() => {}} highlight="B" />);

    expect(screen.getByTestId('child-keyboard')).toBeInTheDocument();
    expect(screen.getByTestId('child-key-B')).toHaveAttribute('data-highlighted', 'true');
    expect(screen.queryByTestId('child-type-input')).not.toBeInTheDocument();
  });

  it('returns the mode alongside the element', () => {
    modeOf('native-touch');
    let captured: ChildInput | undefined;
    render(
      <Harness
        onChar={() => {}}
        onBackspace={() => {}}
        onResult={(r) => {
          captured = r;
        }}
      />
    );

    expect(captured?.mode).toBe('native-touch');
    expect(captured?.inputElement).not.toBeNull();
  });

  it('on a simulated native-touch device, typing into the hidden input calls onChar in order and clears it', () => {
    modeOf('native-touch');
    const onChar = jest.fn();
    render(<Harness onChar={onChar} onBackspace={() => {}} />);

    fireEvent.click(screen.getByTestId('child-type-target'));
    const input = screen.getByTestId('child-type-input') as HTMLInputElement;
    expect(input).toHaveFocus();

    for (const letter of ['s', 'u', 'n']) {
      fireEvent.input(input, { target: { value: letter } });
      expect(input.value).toBe('');
    }

    expect(onChar.mock.calls).toEqual([['s'], ['u'], ['n']]);
  });

  it('on native touch, a native delete calls onBackspace', () => {
    modeOf('native-touch');
    const onBackspace = jest.fn();
    render(<Harness onChar={() => {}} onBackspace={onBackspace} />);

    const event = new Event('beforeinput', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'inputType', { value: 'deleteContentBackward' });
    screen.getByTestId('child-type-input').dispatchEvent(event);

    expect(onBackspace).toHaveBeenCalledTimes(1);
  });

  it('passes numeric through to the on-screen keypad', () => {
    modeOf('onscreen-keypad');
    render(<Harness onChar={() => {}} onBackspace={() => {}} numeric />);

    expect(screen.getByRole('group', { name: 'Number keypad' })).toBeInTheDocument();
  });
});
