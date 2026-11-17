import { type FormEvent, useEffect, useRef } from 'react';
import classes from './ChildTextCapture.module.css';

export interface ChildTextCaptureProps {
  onChar: (char: string) => void;
  onBackspace: () => void;
  numeric?: boolean;
  prompt?: string;
}

interface LatestHandlers {
  onChar: (char: string) => void;
  onBackspace: () => void;
  numeric: boolean;
}

/**
 * Feeds the system keyboard into game callbacks. The hidden input must stay focusable and on screen
 * (1px, near-transparent) because iOS only raises the keyboard for a visible, focused input.
 * Deletions come from beforeinput, since Android keyboards send keydown with key 'Unidentified'.
 */
export function ChildTextCapture({
  onChar,
  onBackspace,
  numeric = false,
  prompt = 'Tap here to type',
}: ChildTextCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handlersRef = useRef<LatestHandlers>({ onChar, onBackspace, numeric });

  useEffect(() => {
    handlersRef.current = { onChar, onBackspace, numeric };
  });

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleBeforeInput = (event: Event) => {
      const inputType = (event as InputEvent).inputType ?? '';
      if (inputType.startsWith('delete')) {
        handlersRef.current.onBackspace();
      }
    };

    input.addEventListener('beforeinput', handleBeforeInput);
    return () => input.removeEventListener('beforeinput', handleBeforeInput);
  }, []);

  const flush = (input: HTMLInputElement) => {
    const typed = input.value;
    input.value = '';
    const { onChar: emit, numeric: digitsOnly } = handlersRef.current;
    for (const char of Array.from(typed)) {
      const accepted = digitsOnly ? /[0-9]/.test(char) : char.trim() !== '';
      if (accepted) emit(char);
    }
  };

  const handleInput = (event: FormEvent<HTMLInputElement>) => {
    // Composition is still in progress (Android keyboards): wait for compositionend.
    if ((event.nativeEvent as InputEvent).isComposing) return;
    flush(event.currentTarget);
  };

  return (
    <>
      <button
        type="button"
        className={classes.target}
        data-testid="child-type-target"
        onClick={() => inputRef.current?.focus()}
      >
        {prompt}
      </button>
      <input
        ref={inputRef}
        type="text"
        className={classes.hiddenInput}
        data-testid="child-type-input"
        aria-label="Type letters"
        autoCapitalize="characters"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="next"
        inputMode={numeric ? 'numeric' : 'text'}
        onInput={handleInput}
        onCompositionEnd={(event) => flush(event.currentTarget)}
      />
    </>
  );
}
