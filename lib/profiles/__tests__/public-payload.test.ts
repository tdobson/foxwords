import { buildPublicPlayPayload } from '../public-payload';
import type { CustomWordRow, MediaAssetRow } from '../../db/types';

describe('buildPublicPlayPayload', () => {
  it('combines custom words with built-in words and constructs public play-token media URLs', () => {
    const customWords: CustomWordRow[] = [
      {
        id: 'w_1',
        profile_id: 'prof_1',
        word: 'TRACTOR',
        category: 'toy',
        prompt_label: 'Green Tractor',
        prompt_emoji: '🚜',
        photo_asset_id: 'ast_photo_1',
        audio_asset_id: 'ast_audio_1',
        sort_order: 1,
        created_at: 1000,
        updated_at: 1000,
      },
    ];

    const assets: MediaAssetRow[] = [
      {
        id: 'ast_photo_1',
        profile_id: 'prof_1',
        r2_key: 'dev/prof_1/ast_photo_1.jpg',
        kind: 'photo',
        content_type: 'image/jpeg',
        byte_size: 1024,
        created_at: 1000,
      },
      {
        id: 'ast_audio_1',
        profile_id: 'prof_1',
        r2_key: 'dev/prof_1/ast_audio_1.webm',
        kind: 'word-audio',
        content_type: 'audio/webm',
        byte_size: 2048,
        created_at: 1000,
      },
    ];

    const payload = buildPublicPlayPayload({
      childName: 'Sarah',
      playToken: 'play_tok_123',
      customWords,
      assets,
    });

    expect(payload.childName).toBe('Sarah');
    expect(payload.words.length).toBeGreaterThan(1);
    expect(payload.words[0].word).toBe('TRACTOR');
    expect(payload.words[0].photoUrl).toBe('/api/play/play_tok_123/assets/ast_photo_1');
    expect(payload.words[0].audioUrl).toBe('/api/play/play_tok_123/assets/ast_audio_1');
    expect(payload.words[0].audioSource).toBe('family');

    // Does not expose database internals or raw R2 keys
    const rawJson = JSON.stringify(payload);
    expect(rawJson).not.toContain('r2_key');
    expect(rawJson).not.toContain('dev/prof_1');
    expect(rawJson).not.toContain('user_id');
  });
});
