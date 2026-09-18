import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { TouchInput } from '../TouchInput';

describe('TouchInput', () => {
  it('allows typing via native input field', () => {
    const handleChange = jest.fn();
    render(
      <MantineProvider>
        <TouchInput label="Child's Name" value="" onChange={handleChange} />
      </MantineProvider>
    );

    const input = screen.getByLabelText("Child's Name");
    fireEvent.change(input, { target: { value: 'LEO' } });
    expect(handleChange).toHaveBeenCalledWith('LEO');
  });

  it('formats native input value to uppercase when uppercase prop is true (default)', () => {
    const handleChange = jest.fn();
    render(
      <MantineProvider>
        <TouchInput label="Child's Name" value="" onChange={handleChange} />
      </MantineProvider>
    );

    const input = screen.getByLabelText("Child's Name");
    fireEvent.change(input, { target: { value: 'leo' } });
    expect(handleChange).toHaveBeenCalledWith('LEO');
  });

  it('preserves casing when uppercase prop is false', () => {
    const handleChange = jest.fn();
    render(
      <MantineProvider>
        <TouchInput label="Child's Name" value="" onChange={handleChange} uppercase={false} />
      </MantineProvider>
    );

    const input = screen.getByLabelText("Child's Name");
    fireEvent.change(input, { target: { value: 'leo' } });
    expect(handleChange).toHaveBeenCalledWith('leo');
  });

  it('appends characters when onscreen touch buttons are tapped', () => {
    const handleChange = jest.fn();
    render(
      <MantineProvider>
        <TouchInput label="Sibling" value="MA" onChange={handleChange} showKeypad />
      </MantineProvider>
    );

    const keyY = screen.getByRole('button', { name: 'Y' });
    fireEvent.click(keyY);
    expect(handleChange).toHaveBeenCalledWith('MAY');
  });

  it('handles backspace button by removing the last character', () => {
    const handleChange = jest.fn();
    render(
      <MantineProvider>
        <TouchInput label="Sibling" value="MAYA" onChange={handleChange} showKeypad />
      </MantineProvider>
    );

    const backspaceBtn = screen.getByRole('button', { name: /delete|backspace/i });
    fireEvent.click(backspaceBtn);
    expect(handleChange).toHaveBeenCalledWith('MAY');
  });

  it('handles clear button by clearing the input', () => {
    const handleChange = jest.fn();
    render(
      <MantineProvider>
        <TouchInput label="Sibling" value="MAYA" onChange={handleChange} showKeypad />
      </MantineProvider>
    );

    const clearBtn = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearBtn);
    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('toggles keypad visibility when keypad toggle button is clicked', () => {
    render(
      <MantineProvider>
        <TouchInput label="Sibling" value="" onChange={() => {}} />
      </MantineProvider>
    );

    expect(screen.queryByRole('button', { name: 'A' })).not.toBeInTheDocument();

    const toggleBtn = screen.getByRole('button', { name: /show touch keypad|open keypad|keypad/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument();
  });
});
