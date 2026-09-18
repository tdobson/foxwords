import { buildStudioQueue } from '../studio-queue';

describe('buildStudioQueue', () => {
  it('generates Chapter 1 with child name, siblings, and parents', () => {
    const queue = buildStudioQueue({
      childName: 'Leo',
      siblings: ['Maya', 'Finn'],
      caregivers: ['Mum', 'Dad'],
    });

    const ch1 = queue.filter((i) => i.chapter === 1);
    expect(ch1[0].targetWord).toBe('LEO');
    expect(ch1[0].kind).toBe('child');
    expect(ch1[1].targetWord).toBe('MAYA');
    expect(ch1[2].targetWord).toBe('FINN');
    expect(ch1.some((i) => i.targetWord === 'MUM')).toBe(true);
    expect(ch1.some((i) => i.targetWord === 'DAD')).toBe(true);
  });

  it('generates Chapter 2 with all 26 alphabet phonemes and letter names', () => {
    const queue = buildStudioQueue({ childName: 'Leo' });
    const ch2 = queue.filter((i) => i.chapter === 2);
    expect(ch2.filter((i) => i.kind === 'phoneme')).toHaveLength(26);
    expect(ch2.filter((i) => i.kind === 'letter-name')).toHaveLength(26);
  });

  it('generates Chapter 3 numbers 1-10', () => {
    const queue = buildStudioQueue({ childName: 'Leo' });
    const ch3 = queue.filter((i) => i.chapter === 3);
    expect(ch3.some((i) => i.clipKey === 'number_1')).toBe(true);
    expect(ch3.some((i) => i.clipKey === 'number_10')).toBe(true);
  });

  it('generates Chapter 4 praise phrases', () => {
    const queue = buildStudioQueue({ childName: 'Leo' });
    const ch4 = queue.filter((i) => i.chapter === 4);
    expect(ch4.some((i) => i.clipKey === 'praise_great_job')).toBe(true);
  });

  it('handles edge cases: single-letter names, punctuation in names, empty sibling list', () => {
    const queue = buildStudioQueue({
      childName: 'Jo-Jo',
      siblings: [],
    });

    const ch1 = queue.filter((i) => i.chapter === 1);
    expect(ch1.length).toBeGreaterThan(0);
    expect(ch1[0].targetWord).toBe('JO-JO');
    expect(ch1[0].kind).toBe('child');
    // Default caregivers are provided when none specified
    expect(ch1.some((i) => i.targetWord === 'MUM')).toBe(true);
    expect(ch1.some((i) => i.targetWord === 'DAD')).toBe(true);
    expect(ch1.some((i) => i.targetWord === 'GRANDAD')).toBe(true);
  });

  it('includes optional pets in Chapter 1 when provided', () => {
    const queue = buildStudioQueue({
      childName: 'Sam',
      pets: ['Rover'],
    });

    const ch1 = queue.filter((i) => i.chapter === 1);
    expect(ch1.some((i) => i.targetWord === 'ROVER' && i.kind === 'pet')).toBe(true);
  });

  it('populates required contract properties on all prompt items', () => {
    const queue = buildStudioQueue({ childName: 'Leo' });
    for (const item of queue) {
      expect(item.key).toBeTruthy();
      expect([1, 2, 3, 4]).toContain(item.chapter);
      expect(item.targetWord).toBeTruthy();
      expect(item.promptLabel).toBeTruthy();
      expect(item.hint).toBeTruthy();
      expect(item.kind).toBeTruthy();
      expect(item.clipKey).toBeTruthy();
      expect(['word-audio', 'system-audio']).toContain(item.assetKind);
    }
  });
});
