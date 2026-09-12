import type { ClockDifficulty, ClockTargetTime, ClockToken } from '../types/clock.types';

function formatNextHour(hour: number): number {
  return (hour % 12) + 1;
}

function createEasyTargets(): ClockTargetTime[] {
  const targets: ClockTargetTime[] = [];
  for (let h = 1; h <= 12; h++) {
    targets.push({
      id: `easy-${h}-00`,
      hour: h,
      minute: 0,
      difficulty: 'easy',
      spokenPhrase: `It is ${h} o'clock`,
      audioSlug: `clock-it-is-${h}-oclock`,
      tokens: [
        {
          key: String(h),
          text: `${h}`,
        },
      ],
    });
  }
  return targets;
}

function createMediumTargets(): ClockTargetTime[] {
  const targets: ClockTargetTime[] = [];
  for (let h = 1; h <= 12; h++) {
    const nextH = formatNextHour(h);

    // Quarter past
    targets.push({
      id: `medium-${h}-15`,
      hour: h,
      minute: 15,
      difficulty: 'medium',
      spokenPhrase: `It is quarter past ${h}`,
      audioSlug: `clock-it-is-quarter-past-${h}`,
      tokens: [
        { key: 'q', text: 'Quarter ' },
        { key: 'p', text: 'past ' },
        { key: String(h), text: `${h}` },
      ],
    });

    // Half past
    targets.push({
      id: `medium-${h}-30`,
      hour: h,
      minute: 30,
      difficulty: 'medium',
      spokenPhrase: `It is half past ${h}`,
      audioSlug: `clock-it-is-half-past-${h}`,
      tokens: [
        { key: 'h', text: 'Half ' },
        { key: 'p', text: 'past ' },
        { key: String(h), text: `${h}` },
      ],
    });

    // Quarter to
    targets.push({
      id: `medium-${h}-45`,
      hour: h,
      minute: 45,
      difficulty: 'medium',
      spokenPhrase: `It is quarter to ${nextH}`,
      audioSlug: `clock-it-is-quarter-to-${nextH}`,
      tokens: [
        { key: 'q', text: 'Quarter ' },
        { key: 't', text: 'to ' },
        { key: String(nextH), text: `${nextH}` },
      ],
    });
  }
  return targets;
}

function createHardTargets(): ClockTargetTime[] {
  const targets: ClockTargetTime[] = [];
  for (let h = 1; h <= 12; h++) {
    const nextH = formatNextHour(h);

    // 5 past
    targets.push({
      id: `hard-${h}-05`,
      hour: h,
      minute: 5,
      difficulty: 'hard',
      spokenPhrase: `It is 5 past ${h}`,
      audioSlug: `clock-it-is-5-past-${h}`,
      tokens: [
        { key: '5', text: '5 ' },
        { key: 'p', text: 'past ' },
        { key: String(h), text: `${h}` },
      ],
    });

    // 5 to
    targets.push({
      id: `hard-${h}-55`,
      hour: h,
      minute: 55,
      difficulty: 'hard',
      spokenPhrase: `It is 5 to ${nextH}`,
      audioSlug: `clock-it-is-5-to-${nextH}`,
      tokens: [
        { key: '5', text: '5 ' },
        { key: 't', text: 'to ' },
        { key: String(nextH), text: `${nextH}` },
      ],
    });
  }
  return targets;
}

interface MinuteIncrementConfig {
  minute: number;
  minNum: number;
  relation: 'past' | 'to';
}

const ULTRA_MINUTE_CONFIGS: MinuteIncrementConfig[] = [
  { minute: 10, minNum: 10, relation: 'past' },
  { minute: 20, minNum: 20, relation: 'past' },
  { minute: 25, minNum: 25, relation: 'past' },
  { minute: 35, minNum: 25, relation: 'to' },
  { minute: 40, minNum: 20, relation: 'to' },
  { minute: 50, minNum: 10, relation: 'to' },
];

function createUltraTargets(): ClockTargetTime[] {
  const targets: ClockTargetTime[] = [];
  for (let h = 1; h <= 12; h++) {
    const nextH = formatNextHour(h);

    for (const config of ULTRA_MINUTE_CONFIGS) {
      const isPast = config.relation === 'past';
      const targetHour = isPast ? h : nextH;
      const minStr = String(config.minNum);
      const relationKey = isPast ? 'p' : 't';
      const relationText = isPast ? 'past ' : 'to ';

      const tokens: ClockToken[] = [
        { key: minStr, text: `${minStr} ` },
        { key: relationKey, text: relationText },
        { key: String(targetHour), text: `${targetHour}` },
      ];

      const minutePad = config.minute < 10 ? `0${config.minute}` : String(config.minute);

      targets.push({
        id: `ultra-${h}-${minutePad}`,
        hour: h,
        minute: config.minute,
        difficulty: 'ultra',
        spokenPhrase: `It is ${config.minNum} ${config.relation} ${targetHour}`,
        audioSlug: `clock-it-is-${config.minNum}-${config.relation}-${targetHour}`,
        tokens,
      });
    }
  }
  return targets;
}

export const CLOCK_CURRICULUM: Record<ClockDifficulty, ClockTargetTime[]> = {
  easy: createEasyTargets(),
  medium: createMediumTargets(),
  hard: createHardTargets(),
  ultra: createUltraTargets(),
};
