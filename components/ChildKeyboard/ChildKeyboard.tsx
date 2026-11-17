import classes from './ChildKeyboard.module.css';

export interface ChildKeyboardProps {
  onChar: (char: string) => void;
  onBackspace: () => void;
  numeric?: boolean;
  highlight?: string;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DIGITS = '0123456789'.split('');
const COLOUR_COUNT = 6;

export function ChildKeyboard({
  onChar,
  onBackspace,
  numeric = false,
  highlight,
}: ChildKeyboardProps) {
  const keys = numeric ? DIGITS : LETTERS;
  const expected = highlight?.toUpperCase();

  return (
    <div
      className={classes.keyboard}
      role="group"
      aria-label={numeric ? 'Number keypad' : 'Letter keyboard'}
      data-testid="child-keyboard"
    >
      <div className={classes.grid}>
        {keys.map((key, index) => (
          <button
            key={key}
            type="button"
            className={classes.key}
            data-colour={index % COLOUR_COUNT}
            data-highlighted={expected === key ? 'true' : undefined}
            aria-label={key}
            data-testid={`child-key-${key}`}
            onClick={() => onChar(key)}
          >
            {key}
          </button>
        ))}
        <button
          type="button"
          className={classes.backspace}
          aria-label="Delete"
          data-testid="child-key-backspace"
          onClick={() => onBackspace()}
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
