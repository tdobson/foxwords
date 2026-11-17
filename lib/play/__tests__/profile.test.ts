import { LEARNING_WORDS } from '../../../constants/learning-words';
import type { LearningWord } from '../../../types/learning-word.types';
import {
  isSamePlayCode,
  type PlayProfile,
  parseStoredProfile,
  profileFromPlayPayload,
  STARTER_WORDS,
  wordsForProfile,
} from '../profile';

const childWord: LearningWord = {
  id: 'child_leo',
  word: 'LEO',
  promptLabel: 'Leo',
  accentColor: '#e03131',
  promptImage: '🧒',
  ipa: ['l', 'iː', 'ə', 'ʊ'],
};

const sampleProfile: PlayProfile = {
  playCode: 'LEO123',
  childName: 'Leo',
  words: [childWord, ...STARTER_WORDS],
  audioOverrides: { letter_b: '/api/play/LEO123/assets/ast_b' },
};

describe('STARTER_WORDS', () => {
  it('drops the prototype words james and sarah', () => {
    const ids = STARTER_WORDS.map((word) => word.id);
    expect(ids).not.toContain('james');
    expect(ids).not.toContain('sarah');
    expect(STARTER_WORDS.length).toBe(LEARNING_WORDS.length - 2);
  });
});

describe('wordsForProfile', () => {
  it('uses the starter list when there is no profile', () => {
    expect(wordsForProfile(null)).toEqual(STARTER_WORDS);
  });

  it('uses the profile word list exactly as stored, without re-adding starter words', () => {
    const words = [childWord, { ...childWord, id: 'custom_x', word: 'MAYA' }];
    expect(wordsForProfile({ ...sampleProfile, words })).toBe(words);
  });

  it('falls back to the starter list when a profile has no words', () => {
    expect(wordsForProfile({ ...sampleProfile, words: [] })).toEqual(STARTER_WORDS);
  });
});

describe('profileFromPlayPayload', () => {
  it('stores the server word list and overrides unchanged', () => {
    const profile = profileFromPlayPayload('LEO123', {
      childName: 'Leo',
      words: [childWord],
      audioOverrides: { letter_b: '/x' },
    });
    expect(profile).toEqual({
      playCode: 'LEO123',
      childName: 'Leo',
      words: [childWord],
      audioOverrides: { letter_b: '/x' },
    });
  });

  it('defaults overrides to an empty object', () => {
    const profile = profileFromPlayPayload('LEO123', { childName: 'Leo', words: [childWord] });
    expect(profile.audioOverrides).toEqual({});
  });
});

describe('isSamePlayCode', () => {
  it('matches case-insensitively and rejects null or other codes', () => {
    expect(isSamePlayCode(sampleProfile, 'leo123')).toBe(true);
    expect(isSamePlayCode(sampleProfile, 'OTHER1')).toBe(false);
    expect(isSamePlayCode(null, 'LEO123')).toBe(false);
  });
});

describe('parseStoredProfile', () => {
  it('round-trips a stored profile', () => {
    expect(parseStoredProfile(JSON.parse(JSON.stringify(sampleProfile)))).toEqual(sampleProfile);
  });

  it('discards the old items-based shape from earlier builds', () => {
    expect(
      parseStoredProfile({
        profileId: 'prof_1',
        childName: 'Maya',
        items: [{ id: 'a', word: 'MUM' }],
        audioOverrides: {},
      })
    ).toBeNull();
  });

  it('rejects non-objects and malformed words', () => {
    expect(parseStoredProfile(null)).toBeNull();
    expect(parseStoredProfile('LEO')).toBeNull();
    expect(parseStoredProfile({ ...sampleProfile, words: [{ id: 1 }] })).toBeNull();
    expect(parseStoredProfile({ ...sampleProfile, words: [] })).toBeNull();
  });

  it('keeps a valid profile with missing overrides and sets them to empty', () => {
    const { audioOverrides: _ignored, ...withoutOverrides } = sampleProfile;
    expect(parseStoredProfile(withoutOverrides)?.audioOverrides).toEqual({});
  });
});
