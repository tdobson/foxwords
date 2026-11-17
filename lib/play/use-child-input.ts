// Usage: const { mode, inputElement } = useChildInput({ onChar, onBackspace }); render {inputElement} in the game.
// Native touch (Android, iPhone, iPad) gets a hidden input so the system keyboard opens; other touch screens get
// ChildKeyboard; hardware keyboards get null, so the game keeps its own window keydown listener.
import { createElement, type ReactNode } from 'react';
import { ChildKeyboard } from '../../components/ChildKeyboard/ChildKeyboard';
import { ChildTextCapture } from '../../components/ChildTextCapture/ChildTextCapture';
import { type InputMode, useInputMode } from '../device/input-mode';

export interface UseChildInputOptions {
  onChar: (char: string) => void;
  onBackspace: () => void;
  numeric?: boolean;
  highlight?: string;
}

export interface ChildInput {
  mode: InputMode;
  inputElement: ReactNode;
}

export function useChildInput({
  onChar,
  onBackspace,
  numeric = false,
  highlight,
}: UseChildInputOptions): ChildInput {
  const mode = useInputMode();

  let inputElement: ReactNode = null;
  if (mode === 'native-touch') {
    inputElement = createElement(ChildTextCapture, { onChar, onBackspace, numeric });
  } else if (mode === 'onscreen-keypad') {
    inputElement = createElement(ChildKeyboard, { onChar, onBackspace, numeric, highlight });
  }

  return { mode, inputElement };
}
