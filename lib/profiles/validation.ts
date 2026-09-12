import type { CustomWordCategory } from '../db/types';
import { validateWord } from '../security/crypto';

export const VALID_CATEGORIES: ReadonlyArray<CustomWordCategory> = [
  'vip',
  'family',
  'pet',
  'toy',
  'custom',
] as const;

export function validateChildName(name: string): string {
  if (typeof name !== 'string') {
    throw new Error('Child name must be a string');
  }
  const trimmed = name.trim();
  if (!trimmed || trimmed.length === 0) {
    throw new Error('Child name cannot be empty');
  }
  if (trimmed.length > 32) {
    throw new Error('Child name is too long (max 32 characters)');
  }
  return trimmed;
}

export function validateCategory(category: string): CustomWordCategory {
  if (!category || !VALID_CATEGORIES.includes(category as CustomWordCategory)) {
    throw new Error(`Invalid category: ${category}. Allowed: ${VALID_CATEGORIES.join(', ')}`);
  }
  return category as CustomWordCategory;
}

export interface ValidatedCustomItemInput {
  word: string;
  category: CustomWordCategory;
  promptLabel: string;
  promptEmoji?: string | null;
  photoAssetId?: string | null;
  audioAssetId?: string | null;
  sortOrder?: number;
}

export function validateCustomItemInput(body: any): ValidatedCustomItemInput {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request payload');
  }

  if (typeof body.word !== 'string' || !body.word.trim()) {
    throw new Error('Word is required');
  }
  const word = validateWord(body.word);

  if (typeof body.promptLabel !== 'string' || !body.promptLabel.trim()) {
    throw new Error('Prompt label is required');
  }
  const promptLabel = body.promptLabel.trim();
  if (promptLabel.length > 64) {
    throw new Error('Prompt label is too long (max 64 characters)');
  }

  const category = validateCategory(body.category);

  let promptEmoji: string | null = null;
  if (body.promptEmoji !== undefined && body.promptEmoji !== null) {
    if (typeof body.promptEmoji !== 'string' || body.promptEmoji.length > 8) {
      throw new Error('Invalid prompt emoji');
    }
    promptEmoji = body.promptEmoji.trim() || null;
  }

  const photoAssetId =
    typeof body.photoAssetId === 'string' && body.photoAssetId.trim()
      ? body.photoAssetId.trim()
      : null;

  const audioAssetId =
    typeof body.audioAssetId === 'string' && body.audioAssetId.trim()
      ? body.audioAssetId.trim()
      : null;

  const sortOrder =
    typeof body.sortOrder === 'number' && Number.isInteger(body.sortOrder) ? body.sortOrder : 0;

  return {
    word,
    category,
    promptLabel,
    promptEmoji,
    photoAssetId,
    audioAssetId,
    sortOrder,
  };
}
