import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { useInputMode } from '../../../lib/device/input-mode';
import { TouchInput } from '../TouchInput';

jest.mock('../../../lib/device/input-mode', () => ({
  useInputMode: jest.fn(() => 'hardware'),
}));

const mockedUseInputMode = useInputMode as jest.MockedFunction<typeof useInputMode>;

function renderInput(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('TouchInput', () => {
  beforeEach(() => {
    mockedUseInputMode.mockReturnValue('hardware');
  });

  describe('text field attributes (all devices)', () => {
    it('uses the native keyboard hints for names', () => {
      renderInput(<TouchInput label="Child's Name" value="" onChange={() => {}} />);

      const input = screen.getByLabelText("Child's Name");
      expect(input).toHaveAttribute('autocapitalize', 'words');
      expect(input).toHaveAttribute('autocomplete', 'off');
      expect(input).toHaveAttribute('autocorrect', 'off');
      expect(input).toHaveAttribute('enterkeyhint', 'done');
    });

    it('does not show the keypad toggle on a hardware keyboard device', () => {
      renderInput(<TouchInput label="Sibling" value="" onChange={() => {}} />);

      expect(screen.queryByRole('button', { name: /keypad/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'Touch keypad' })).not.toBeInTheDocument();
    });

    it('does not show the keypad toggle on native touch (Android, iOS, iPadOS)', () => {
      mockedUseInputMode.mockReturnValue('native-touch');
      renderInput(<TouchInput label="Sibling" value="" onChange={() => {}} />);

      expect(screen.getByLabelText('Sibling')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /keypad/i })).not.toBeInTheDocument();
    });

    it('hides the keypad even when showKeypad is set on native touch', () => {
      mockedUseInputMode.mockReturnValue('native-touch');
      renderInput(<TouchInput label="Sibling" value="" onChange={() => {}} showKeypad />);

      expect(screen.queryByRole('button', { name: 'A' })).not.toBeInTheDocument();
    });
  });

  describe('typing into the field', () => {
    it('allows typing via native input field', () => {
      const handleChange = jest.fn();
      renderInput(<TouchInput label="Child's Name" value="" onChange={handleChange} />);

      fireEvent.change(screen.getByLabelText("Child's Name"), { target: { value: 'LEO' } });
      expect(handleChange).toHaveBeenCalledWith('LEO');
    });

    it('formats native input value to uppercase when uppercase prop is true (default)', () => {
      const handleChange = jest.fn();
      renderInput(<TouchInput label="Child's Name" value="" onChange={handleChange} />);

      fireEvent.change(screen.getByLabelText("Child's Name"), { target: { value: 'leo' } });
      expect(handleChange).toHaveBeenCalledWith('LEO');
    });

    it('preserves casing when uppercase prop is false', () => {
      const handleChange = jest.fn();
      renderInput(
        <TouchInput label="Child's Name" value="" onChange={handleChange} uppercase={false} />
      );

      fireEvent.change(screen.getByLabelText("Child's Name"), { target: { value: 'leo' } });
      expect(handleChange).toHaveBeenCalledWith('leo');
    });
  });

  describe('on-screen keypad (onscreen-keypad devices only)', () => {
    beforeEach(() => {
      mockedUseInputMode.mockReturnValue('onscreen-keypad');
    });

    it('toggles keypad visibility when keypad toggle button is clicked', () => {
      renderInput(<TouchInput label="Sibling" value="" onChange={() => {}} />);

      expect(screen.queryByRole('button', { name: 'A' })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Show touch keypad' }));

      expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument();
    });

    it('appends characters when onscreen touch buttons are tapped', () => {
      const handleChange = jest.fn();
      renderInput(<TouchInput label="Sibling" value="MA" onChange={handleChange} showKeypad />);

      fireEvent.click(screen.getByRole('button', { name: 'Y' }));
      expect(handleChange).toHaveBeenCalledWith('MAY');
    });

    it('handles backspace button by removing the last character', () => {
      const handleChange = jest.fn();
      renderInput(<TouchInput label="Sibling" value="MAYA" onChange={handleChange} showKeypad />);

      fireEvent.click(screen.getByRole('button', { name: 'Backspace' }));
      expect(handleChange).toHaveBeenCalledWith('MAY');
    });

    it('handles clear button by clearing the input', () => {
      const handleChange = jest.fn();
      renderInput(<TouchInput label="Sibling" value="MAYA" onChange={handleChange} showKeypad />);

      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
      expect(handleChange).toHaveBeenCalledWith('');
    });
  });
});
