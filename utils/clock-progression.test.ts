import { describe, expect, it } from '@jest/globals';
import { CLOCK_CURRICULUM } from '../constants/clock-curriculum';
import type { ClockProgressionState, ClockTargetTime } from '../types/clock.types';
import { getClockProgressionResult, getRevealedText } from './clock-progression';

describe('clock-progression matcher', () => {
  const initialState: ClockProgressionState = {
    tokenIndex: 0,
    enteredKeyBuffer: '',
  };

  describe("Easy mode (O'clock)", () => {
    // 4 o'clock: single digit hour
    const fourOclock = CLOCK_CURRICULUM.easy.find((t) => t.id === 'easy-4-00')!;

    it('completes on pressing single digit hour', () => {
      const res = getClockProgressionResult(fourOclock, initialState, '4');
      expect(res.kind).toBe('advanced');
      expect(res.completed).toBe(true);
      expect(res.revealedText).toBe('4');
      expect(res.state.tokenIndex).toBe(1);
      expect(res.state.enteredKeyBuffer).toBe('');
    });

    it('marks incorrect key when wrong digit pressed', () => {
      const res = getClockProgressionResult(fourOclock, initialState, '5');
      expect(res.kind).toBe('incorrect');
      expect(res.completed).toBe(false);
      expect(res.revealedText).toBe('');
      expect(res.state).toEqual(initialState);
    });

    // 12 o'clock: multi-digit hour
    const twelveOclock = CLOCK_CURRICULUM.easy.find((t) => t.id === 'easy-12-00')!;

    it('buffers first digit for multi-digit hour and completes on second digit', () => {
      const step1 = getClockProgressionResult(twelveOclock, initialState, '1');
      expect(step1.kind).toBe('advanced');
      expect(step1.completed).toBe(false);
      expect(step1.state.tokenIndex).toBe(0);
      expect(step1.state.enteredKeyBuffer).toBe('1');
      expect(step1.revealedText).toBe('');

      const step2 = getClockProgressionResult(twelveOclock, step1.state, '2');
      expect(step2.kind).toBe('advanced');
      expect(step2.completed).toBe(true);
      expect(step2.state.tokenIndex).toBe(1);
      expect(step2.state.enteredKeyBuffer).toBe('');
      expect(step2.revealedText).toBe('12');
    });

    it('rejects wrong second digit for multi-digit hour', () => {
      const step1 = getClockProgressionResult(twelveOclock, initialState, '1');
      const step2 = getClockProgressionResult(twelveOclock, step1.state, '3');
      expect(step2.kind).toBe('incorrect');
      expect(step2.completed).toBe(false);
      expect(step2.state).toEqual(step1.state);
      expect(step2.revealedText).toBe('');
    });
  });

  describe('Medium mode (Quarter / Half)', () => {
    // Quarter to 8: tokens: ['q', 't', '8'] -> "Quarter ", "to ", "8"
    const quarterToEight = CLOCK_CURRICULUM.medium.find((t) => t.id === 'medium-7-45')!;

    it('accepts Q (case-insensitive) and advances token index', () => {
      const resUpper = getClockProgressionResult(quarterToEight, initialState, 'Q');
      expect(resUpper.kind).toBe('advanced');
      expect(resUpper.completed).toBe(false);
      expect(resUpper.revealedText).toBe('Quarter ');
      expect(resUpper.state.tokenIndex).toBe(1);

      const resLower = getClockProgressionResult(quarterToEight, initialState, 'q');
      expect(resLower.kind).toBe('advanced');
      expect(resLower.revealedText).toBe('Quarter ');
    });

    it('progresses through full sequence Q -> T -> 8', () => {
      const step1 = getClockProgressionResult(quarterToEight, initialState, 'q');
      expect(step1.revealedText).toBe('Quarter ');

      const step2 = getClockProgressionResult(quarterToEight, step1.state, 't');
      expect(step2.kind).toBe('advanced');
      expect(step2.completed).toBe(false);
      expect(step2.revealedText).toBe('Quarter to ');
      expect(step2.state.tokenIndex).toBe(2);

      const step3 = getClockProgressionResult(quarterToEight, step2.state, '8');
      expect(step3.kind).toBe('advanced');
      expect(step3.completed).toBe(true);
      expect(step3.revealedText).toBe('Quarter to 8');
      expect(step3.state.tokenIndex).toBe(3);
    });

    it('rejects incorrect key without mutating token index', () => {
      const step1 = getClockProgressionResult(quarterToEight, initialState, 'q');
      const step2Fail = getClockProgressionResult(quarterToEight, step1.state, 'p');
      expect(step2Fail.kind).toBe('incorrect');
      expect(step2Fail.completed).toBe(false);
      expect(step2Fail.state).toEqual(step1.state);
      expect(step2Fail.revealedText).toBe('Quarter ');
    });

    // Half past 3
    const halfPastThree = CLOCK_CURRICULUM.medium.find((t) => t.id === 'medium-3-30')!;

    it('handles Half past with H -> P -> 3', () => {
      const s1 = getClockProgressionResult(halfPastThree, initialState, 'H');
      expect(s1.revealedText).toBe('Half ');
      const s2 = getClockProgressionResult(halfPastThree, s1.state, 'P');
      expect(s2.revealedText).toBe('Half past ');
      const s3 = getClockProgressionResult(halfPastThree, s2.state, '3');
      expect(s3.completed).toBe(true);
      expect(s3.revealedText).toBe('Half past 3');
    });
  });

  describe('Hard mode (5 past / 5 to)', () => {
    // 5 past 4: tokens: ['5', 'p', '4'] -> "5 ", "past ", "4"
    const fivePastFour = CLOCK_CURRICULUM.hard.find((t) => t.id === 'hard-4-05')!;

    it('progresses through 5 -> p -> 4', () => {
      const s1 = getClockProgressionResult(fivePastFour, initialState, '5');
      expect(s1.revealedText).toBe('5 ');
      const s2 = getClockProgressionResult(fivePastFour, s1.state, 'p');
      expect(s2.revealedText).toBe('5 past ');
      const s3 = getClockProgressionResult(fivePastFour, s2.state, '4');
      expect(s3.completed).toBe(true);
      expect(s3.revealedText).toBe('5 past 4');
    });
  });

  describe('Ultra Hard mode (Multi-digit minutes and hours)', () => {
    // 25 to 12: id: ultra-11-35, tokens: ['25', 't', '12'] -> "25 ", "to ", "12"
    const twentyFiveToTwelve = CLOCK_CURRICULUM.ultra.find((t) => t.id === 'ultra-11-35')!;

    it('progresses through multi-digit minute (2, 5), relation (t), and multi-digit hour (1, 2)', () => {
      // 2
      const s1 = getClockProgressionResult(twentyFiveToTwelve, initialState, '2');
      expect(s1.kind).toBe('advanced');
      expect(s1.completed).toBe(false);
      expect(s1.state.enteredKeyBuffer).toBe('2');
      expect(s1.state.tokenIndex).toBe(0);
      expect(s1.revealedText).toBe('');

      // 5
      const s2 = getClockProgressionResult(twentyFiveToTwelve, s1.state, '5');
      expect(s2.kind).toBe('advanced');
      expect(s2.completed).toBe(false);
      expect(s2.state.enteredKeyBuffer).toBe('');
      expect(s2.state.tokenIndex).toBe(1);
      expect(s2.revealedText).toBe('25 ');

      // t
      const s3 = getClockProgressionResult(twentyFiveToTwelve, s2.state, 't');
      expect(s3.kind).toBe('advanced');
      expect(s3.completed).toBe(false);
      expect(s3.revealedText).toBe('25 to ');
      expect(s3.state.tokenIndex).toBe(2);

      // 1
      const s4 = getClockProgressionResult(twentyFiveToTwelve, s3.state, '1');
      expect(s4.kind).toBe('advanced');
      expect(s4.completed).toBe(false);
      expect(s4.state.enteredKeyBuffer).toBe('1');
      expect(s4.state.tokenIndex).toBe(2);
      expect(s4.revealedText).toBe('25 to ');

      // 2
      const s5 = getClockProgressionResult(twentyFiveToTwelve, s4.state, '2');
      expect(s5.kind).toBe('advanced');
      expect(s5.completed).toBe(true);
      expect(s5.state.enteredKeyBuffer).toBe('');
      expect(s5.state.tokenIndex).toBe(3);
      expect(s5.revealedText).toBe('25 to 12');
    });
  });

  describe('Ignored keys and edge cases', () => {
    const sample = CLOCK_CURRICULUM.easy[0];

    it('ignores modifier keys without triggering incorrect', () => {
      const modifierKeys = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'];
      for (const key of modifierKeys) {
        const res = getClockProgressionResult(sample, initialState, key);
        expect(res.kind).toBe('ignored');
        expect(res.completed).toBe(false);
        expect(res.state).toEqual(initialState);
      }
    });

    it('ignores input once progression is already completed', () => {
      const completedState: ClockProgressionState = {
        tokenIndex: sample.tokens.length,
        enteredKeyBuffer: '',
      };
      const res = getClockProgressionResult(sample, completedState, '1');
      expect(res.kind).toBe('ignored');
      expect(res.completed).toBe(true);
      expect(res.revealedText).toBe(sample.tokens[0].text);
    });

    it('correctly calculates getRevealedText across slice', () => {
      const mediumTarget: ClockTargetTime = {
        id: 'test',
        hour: 3,
        minute: 15,
        difficulty: 'medium',
        spokenPhrase: 'It is quarter past 3',
        audioSlug: 'test',
        tokens: [
          { key: 'q', text: 'Quarter ' },
          { key: 'p', text: 'past ' },
          { key: '3', text: '3' },
        ],
      };

      expect(getRevealedText(mediumTarget, { tokenIndex: 0, enteredKeyBuffer: '' })).toBe('');
      expect(getRevealedText(mediumTarget, { tokenIndex: 1, enteredKeyBuffer: '' })).toBe(
        'Quarter '
      );
      expect(getRevealedText(mediumTarget, { tokenIndex: 2, enteredKeyBuffer: '' })).toBe(
        'Quarter past '
      );
      expect(getRevealedText(mediumTarget, { tokenIndex: 3, enteredKeyBuffer: '' })).toBe(
        'Quarter past 3'
      );
    });
  });
});
