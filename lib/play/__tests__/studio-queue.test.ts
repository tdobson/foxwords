import { buildStudioQueue, STUDIO_CHAPTERS } from '../studio-queue';

describe('buildStudioQueue', () => {
  it('puts the child first, then siblings, family members and pets, in natural case', () => {
    const queue = buildStudioQueue({
      childName: 'Juniper',
      siblings: ['Maya'],
      familyMembers: ['Grandma'],
      pets: ['Rover'],
    });
    const ch1 = queue.filter((i) => i.chapter === 1);
    expect(ch1.map((i) => i.displayWord)).toEqual(['Juniper', 'Maya', 'Grandma', 'Rover']);
    expect(ch1[0]).toMatchObject({
      kind: 'child',
      clipKey: 'word_juniper',
      assetKind: 'word-audio',
    });
    expect(ch1[0].instruction).toBe('Say: Juniper');
    expect(ch1.find((i) => i.displayWord === 'Rover')?.kind).toBe('pet');
  });

  it('preselects only Mummy and Daddy as family members by default', () => {
    const ch1 = buildStudioQueue({ childName: 'Leo' }).filter((i) => i.chapter === 1);
    expect(ch1.map((i) => i.displayWord)).toEqual(['Leo', 'Mummy', 'Daddy']);
  });

  it('keeps the family list it is given, even when empty', () => {
    const ch1 = buildStudioQueue({ childName: 'Leo', familyMembers: [] }).filter(
      (i) => i.chapter === 1
    );
    expect(ch1.map((i) => i.displayWord)).toEqual(['Leo']);
  });

  it('skips blank and duplicate names', () => {
    const ch1 = buildStudioQueue({
      childName: 'Leo',
      siblings: ['  ', 'Mummy'],
      familyMembers: ['Mummy'],
    }).filter((i) => i.chapter === 1);
    expect(ch1.filter((i) => i.displayWord === 'Mummy')).toHaveLength(1);
  });

  it('gives every letter a sound prompt and a name prompt with a plain instruction', () => {
    const ch2 = buildStudioQueue({ childName: 'Leo' }).filter((i) => i.chapter === 2);
    const sounds = ch2.filter((i) => i.kind === 'phoneme');
    const names = ch2.filter((i) => i.kind === 'letter-name');
    expect(sounds).toHaveLength(26);
    expect(names).toHaveLength(26);
    expect(sounds.find((i) => i.targetWord === 'B')?.instruction).toBe(
      'Say the sound b makes, as in bat'
    );
    expect(names.find((i) => i.targetWord === 'B')?.instruction).toBe('Say the letter name: bee');
  });

  it('counts numbers 1 to 20, matching the counting game', () => {
    const numbers = buildStudioQueue({ childName: 'Leo' }).filter((i) => i.kind === 'number');
    expect(numbers).toHaveLength(20);
    expect(numbers[0]).toMatchObject({ clipKey: 'number_1', displayWord: '1', promptLabel: 'one' });
    expect(numbers[19]).toMatchObject({
      clipKey: 'number_20',
      displayWord: '20',
      promptLabel: 'twenty',
    });
  });

  it('asks for plurals as plurals', () => {
    const plurals = buildStudioQueue({ childName: 'Leo' }).filter((i) => i.kind === 'plural');
    const cats = plurals.find((i) => i.clipKey === 'plural_cat');
    expect(cats).toMatchObject({
      displayWord: 'cats',
      promptLabel: 'cats',
      instruction: 'Say: cats',
    });
    expect(plurals.every((i) => i.displayWord === i.displayWord.toLowerCase())).toBe(true);
    expect(plurals.find((i) => i.clipKey === 'plural_bus')?.displayWord).toBe('buses');
  });

  it('has no praise prompts, because the games do not play praise', () => {
    expect(buildStudioQueue({ childName: 'Leo' }).some((i) => i.kind === 'praise')).toBe(false);
  });

  it('keeps the four chapters in order and marks only Family as required', () => {
    expect(STUDIO_CHAPTERS.map((c) => c.id)).toEqual([1, 2, 3, 4]);
    expect(STUDIO_CHAPTERS.filter((c) => c.mandatory).map((c) => c.id)).toEqual([1]);
  });

  it('gives every prompt the fields the studio needs', () => {
    for (const item of buildStudioQueue({ childName: 'Leo', pets: ['Rover'] })) {
      expect(item.key).toBeTruthy();
      expect([1, 2, 3, 4]).toContain(item.chapter);
      expect(item.targetWord).toBeTruthy();
      expect(item.displayWord).toBeTruthy();
      expect(item.promptLabel).toBeTruthy();
      expect(item.instruction).toBeTruthy();
      expect(item.hint).toBeTruthy();
      expect(item.clipKey).toMatch(/^(word|phoneme|letter|number|plural)_/);
      expect(['word-audio', 'system-audio']).toContain(item.assetKind);
    }
  });
});
