import {
  ClockProgressionResult,
  ClockProgressionState,
  ClockTargetTime,
} from '../types/clock.types';

export function getRevealedText(target: ClockTargetTime, state: ClockProgressionState): string {
  return target.tokens
    .slice(0, state.tokenIndex)
    .map((t) => t.text)
    .join('');
}

export function getClockProgressionResult(
  target: ClockTargetTime,
  state: ClockProgressionState,
  rawKey: string
): ClockProgressionResult {
  if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(rawKey)) {
    return {
      kind: 'ignored',
      state,
      completed: false,
      revealedText: getRevealedText(target, state),
    };
  }
  const key = rawKey.toLowerCase();
  const currentToken = target.tokens[state.tokenIndex];
  if (!currentToken) {
    return {
      kind: 'ignored',
      state,
      completed: true,
      revealedText: getRevealedText(target, state),
    };
  }

  // If token target is multi-character digit (like '11' or '25')
  const expectedKey = currentToken.key.toLowerCase();
  if (expectedKey.length > 1) {
    const nextCharIndex = state.enteredKeyBuffer.length;
    if (key === expectedKey[nextCharIndex]) {
      const newBuffer = state.enteredKeyBuffer + key;
      if (newBuffer === expectedKey) {
        const nextIndex = state.tokenIndex + 1;
        const completed = nextIndex >= target.tokens.length;
        const newState: ClockProgressionState = { tokenIndex: nextIndex, enteredKeyBuffer: '' };
        return {
          kind: 'advanced',
          state: newState,
          completed,
          revealedText: getRevealedText(target, newState),
        };
      }
      const newState: ClockProgressionState = {
        tokenIndex: state.tokenIndex,
        enteredKeyBuffer: newBuffer,
      };
      return {
        kind: 'advanced',
        state: newState,
        completed: false,
        revealedText: getRevealedText(target, newState),
      };
    }
    return {
      kind: 'incorrect',
      state,
      completed: false,
      revealedText: getRevealedText(target, state),
    };
  }

  // Single-key token (e.g. 'q', 'h', 'p', 't', '4')
  if (key === expectedKey) {
    const nextIndex = state.tokenIndex + 1;
    const completed = nextIndex >= target.tokens.length;
    const newState: ClockProgressionState = { tokenIndex: nextIndex, enteredKeyBuffer: '' };
    return {
      kind: 'advanced',
      state: newState,
      completed,
      revealedText: getRevealedText(target, newState),
    };
  }

  return {
    kind: 'incorrect',
    state,
    completed: false,
    revealedText: getRevealedText(target, state),
  };
}
