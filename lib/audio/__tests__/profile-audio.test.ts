import type { LearningWord } from '../../../types/learning-word.types';
import { resolveSystemClip, resolveWordAudio } from '../profile-audio';

describe('profile-audio resolver', () => {
  const timClips = new Set(['james', 'daddy', 'mummy']);

  it('custom word audio wins over Tim clip and speech fallback', () => {
    const wordWithFamilyAudio: LearningWord = {
      id: 'daddy',
      word: 'DADDY',
      promptLabel: 'Daddy',
      accentColor: '#000',
      audioUrl: '/api/play/token123/assets/ast_dad',
      ipa: [],
    };

    const res = resolveWordAudio(wordWithFamilyAudio, timClips);
    expect(res.source).toBe('family');
    expect(res.audioPath).toBe('/api/play/token123/assets/ast_dad');
  });

  it('uses Tim clip when family audio is absent but clip exists', () => {
    const defaultWord: LearningWord = {
      id: 'daddy',
      word: 'DADDY',
      promptLabel: 'Daddy',
      accentColor: '#000',
      ipa: [],
    };

    const res = resolveWordAudio(defaultWord, timClips);
    expect(res.source).toBe('tim');
    expect(res.audioPath).toBe('/audio/words/daddy.webm');
  });

  it('falls back to speech synthesis when neither family audio nor Tim clip exists', () => {
    const customWordWithoutAudio: LearningWord = {
      id: 'custom_excavator',
      word: 'EXCAVATOR',
      promptLabel: 'Big Excavator',
      accentColor: '#000',
      ipa: [],
    };

    const res = resolveWordAudio(customWordWithoutAudio, timClips);
    expect(res.source).toBe('speech');
    expect(res.utteranceText).toBe('Big Excavator');
  });

  it('system clip follows family override -> Tim clip -> speech fallback', () => {
    // 1. Family override wins
    const r1 = resolveSystemClip('clock:one-oclock', '/api/play/tok/assets/a1', '/audio/clock/one-oclock.webm', 'one o clock');
    expect(r1.source).toBe('family');
    expect(r1.audioPath).toBe('/api/play/tok/assets/a1');

    // 2. Tim clip wins if no family override
    const r2 = resolveSystemClip('clock:one-oclock', undefined, '/audio/clock/one-oclock.webm', 'one o clock');
    expect(r2.source).toBe('tim');
    expect(r2.audioPath).toBe('/audio/clock/one-oclock.webm');

    // 3. Speech fallback
    const r3 = resolveSystemClip('clock:twelve-forty-seven', undefined, undefined, 'twelve forty-seven');
    expect(r3.source).toBe('speech');
    expect(r3.utteranceText).toBe('twelve forty-seven');
  });
});
