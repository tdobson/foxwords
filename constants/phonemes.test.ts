import { LEARNING_WORDS } from './learning-words';
import { getPhonemeSlug, PHONEMES } from './phonemes';

describe('phonemes', () => {
  it('has a unique slug for every phoneme', () => {
    const slugs = PHONEMES.map((phoneme) => phoneme.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('covers every IPA symbol used by the learning words', () => {
    const usedSymbols = new Set<string>();
    for (const word of LEARNING_WORDS) {
      for (const symbol of word.ipa) {
        if (symbol !== '') {
          usedSymbols.add(symbol);
        }
      }
    }

    for (const symbol of usedSymbols) {
      expect(getPhonemeSlug(symbol)).not.toBe('');
    }
  });

  it('covers common English sounds like w, v, th, ch and the missing diphthongs', () => {
    const expected = [
      'w',
      'v',
      'th',
      'th2',
      'ch',
      'ng',
      'h',
      'y',
      'qu',
      'oi',
      'ow',
      'oh',
      'ear',
      'er',
      'oo2',
    ];
    for (const slug of expected) {
      expect(PHONEMES.some((phoneme) => phoneme.slug === slug)).toBe(true);
    }
  });
});
