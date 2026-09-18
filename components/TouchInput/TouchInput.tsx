import { Button, TextInput } from '@mantine/core';
import type React from 'react';
import { useState } from 'react';
import classes from './TouchInput.module.css';

export interface TouchInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  uppercase?: boolean;
  showKeypad?: boolean;
  id?: string;
  disabled?: boolean;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export function TouchInput({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  uppercase = true,
  showKeypad: initialShowKeypad = false,
  id,
  disabled = false,
}: TouchInputProps) {
  const [isKeypadOpen, setIsKeypadOpen] = useState(initialShowKeypad);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    onChange(uppercase ? rawVal.toUpperCase() : rawVal);
  };

  const handleKeyClick = (char: string) => {
    const nextChar = uppercase ? char.toUpperCase() : char;
    onChange(value + nextChar);
  };

  const handleBackspace = () => {
    if (value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={classes.container}>
      <div className={classes.inputWrapper}>
        <TextInput
          id={id}
          label={label}
          placeholder={placeholder}
          description={helperText}
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          className={classes.textInput}
          size="md"
          autoComplete="off"
        />
        <Button
          type="button"
          variant="subtle"
          color="gray"
          className={classes.toggleButton}
          onClick={() => setIsKeypadOpen((prev) => !prev)}
          aria-label={isKeypadOpen ? 'Hide touch keypad' : 'Show touch keypad'}
          aria-expanded={isKeypadOpen}
          disabled={disabled}
        >
          {isKeypadOpen ? 'Hide Keypad' : 'Touch Keypad'}
        </Button>
      </div>

      {isKeypadOpen && (
        <div className={classes.keypad} role="group" aria-label="Touch keypad">
          {KEYBOARD_ROWS.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className={classes.row}>
              {rowIndex === 2 && (
                <Button
                  type="button"
                  variant="default"
                  className={`${classes.keyButton} ${classes.actionKey}`}
                  onClick={handleClear}
                  aria-label="Clear"
                  disabled={disabled || value.length === 0}
                >
                  Clear
                </Button>
              )}
              {row.map((char) => (
                <Button
                  key={char}
                  type="button"
                  variant="default"
                  className={classes.keyButton}
                  onClick={() => handleKeyClick(char)}
                  aria-label={char}
                  disabled={disabled}
                >
                  {char}
                </Button>
              ))}
              {rowIndex === 2 && (
                <Button
                  type="button"
                  variant="default"
                  className={`${classes.keyButton} ${classes.actionKey}`}
                  onClick={handleBackspace}
                  aria-label="Backspace"
                  disabled={disabled || value.length === 0}
                >
                  ⌫
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
