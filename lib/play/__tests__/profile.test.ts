import { LEARNING_WORDS } from '../../../constants/learning-words';
import { mergeProfileWithCurriculum, type PlayProfile } from '../profile';

describe('mergeProfileWithCurriculum', () => {
  it('returns default Little Fox and starter words when profile is null', () => {
    const res = mergeProfileWithCurriculum(null);
    expect(res.childName).toBe('Little Fox');
    expect(res.words).toEqual(LEARNING_WORDS);
    expect(res.audioOverrides).toEqual({});
  });

  it('merges custom profile items at the beginning of the curriculum list', () => {
    const profile: PlayProfile = {
      profileId: 'prof_123',
      childName: 'Maya',
      items: [
        {
          id: 'item_mum',
          word: 'MUM',
          promptLabel: 'Mum',
          category: 'vip',
          promptEmoji: '👩',
          photoUrl: '/api/play/token/assets/ast_1',
          audioUrl: '/api/play/token/assets/ast_2',
        },
      ],
      audioOverrides: {
        letter_a: '/api/play/token/assets/ast_3',
      },
    };

    const res = mergeProfileWithCurriculum(profile);
    expect(res.childName).toBe('Maya');
    expect(res.words.length).toBe(LEARNING_WORDS.length + 1);
    expect(res.words[0].word).toBe('MUM');
    expect(res.words[0].photoUrl).toBe('/api/play/token/assets/ast_1');
    expect(res.words[0].audioUrl).toBe('/api/play/token/assets/ast_2');
    expect(res.words[0].audioSource).toBe('family');
    expect(res.audioOverrides.letter_a).toBe('/api/play/token/assets/ast_3');
  });
});
