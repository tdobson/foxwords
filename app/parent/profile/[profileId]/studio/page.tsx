'use client';

import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Chip,
  Container,
  Group,
  Loader,
  Paper,
  Progress,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCheck,
  IconMicrophone,
  IconPlayerPlay,
  IconPlus,
  IconTrash,
  IconVolume,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { TouchInput } from '../../../../../components/TouchInput/TouchInput';
import { resolveClipUrl } from '../../../../../lib/audio/clips';
import {
  buildStudioQueue,
  STUDIO_CHAPTERS,
  type StudioPromptItem,
} from '../../../../../lib/play/studio-queue';
import classes from './StudioPage.module.css';

interface ProfileData {
  id: string;
  childName: string;
  playCode: string;
  words?: any[];
}

type View = 'family' | 'studio' | 'finish';
type RecordState = 'idle' | 'recording' | 'review' | 'saving';
type MicError = 'denied' | 'unavailable' | null;

interface Pending {
  item: StudioPromptItem;
  blob: Blob;
  url: string;
}

interface ExtraPerson {
  name: string;
  pet: boolean;
}

const FAMILY_CHIPS = ['Mummy', 'Daddy', 'Mum', 'Dad', 'Grandma', 'Grandad', 'Nana', 'Grandpa'];
const DEFAULT_CHIPS = ['Mummy', 'Daddy'];
const MAX_RECORD_MS = 4000;
const INTERACTIVE_TAGS = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'];

function clipKeyFor(name: string): string {
  return `word_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
}

function categoryFor(item: StudioPromptItem): 'family' | 'vip' | 'pet' {
  if (item.kind === 'pet') return 'pet';
  if (item.kind === 'caregiver') return 'vip';
  return 'family';
}

function makeUrl(blob: Blob): string {
  return typeof URL.createObjectURL === 'function' ? URL.createObjectURL(blob) : 'blob:studio';
}

function revokeUrl(url: string) {
  if (typeof URL.revokeObjectURL === 'function' && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

function stopTracks(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export default function ParentVoiceStudioPage() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const params = useParams();
  const profileId = params.profileId as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [recorded, setRecorded] = useState<Record<string, string>>({});

  // Family step
  const [view, setView] = useState<View>('family');
  const [childName, setChildName] = useState('');
  const [siblings, setSiblings] = useState<string[]>([]);
  const [siblingInput, setSiblingInput] = useState('');
  const [chips, setChips] = useState<string[]>(DEFAULT_CHIPS);
  const [extras, setExtras] = useState<ExtraPerson[]>([]);
  const [extraInput, setExtraInput] = useState('');
  const [extraIsPet, setExtraIsPet] = useState(false);
  const [familySaving, setFamilySaving] = useState(false);
  const [familyError, setFamilyError] = useState<string | null>(null);

  // Studio
  const [queue, setQueue] = useState<StudioPromptItem[]>([]);
  const [index, setIndex] = useState(0);
  const [skipped, setSkipped] = useState<Set<string>>(() => new Set());
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [pending, setPending] = useState<Pending | null>(null);
  const [micError, setMicError] = useState<MicError>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [level, setLevel] = useState(0);

  const pendingRef = useRef<Pending | null>(null);
  const savingRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordItemRef = useRef<StudioPromptItem | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const meterRef = useRef<{ ctx: AudioContext | null; frame: number | null }>({
    ctx: null,
    frame: null,
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});

  // Load the profile, its family words and its existing recordings
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [profRes, ovRes] = await Promise.all([
          fetch(`/api/profiles/${profileId}`),
          fetch(`/api/profiles/${profileId}/audio-overrides`),
        ]);
        if (profRes.status === 401) {
          routerRef.current.push('/parent/login');
          return;
        }
        if (!profRes.ok) {
          if (mounted) setLoadError('We could not load this profile.');
          return;
        }
        const pData: any = await profRes.json();
        if (!mounted) return;
        const p: ProfileData = pData.profile;
        setProfile(p);
        setChildName(p.childName ?? '');

        const found: Record<string, string> = {};
        if (ovRes.ok) {
          const ovData: any = await ovRes.json();
          for (const ov of ovData.overrides || []) {
            found[ov.clip_key] = ov.asset_id;
          }
        }

        const ownChildKey = clipKeyFor(p.childName ?? '');
        const prefillSiblings: string[] = [];
        const prefillChips: string[] = [];
        const prefillExtras: ExtraPerson[] = [];
        for (const w of p.words ?? []) {
          const label = String(w.prompt_label || w.word || '').trim();
          if (!label) continue;
          if (w.audio_asset_id) found[clipKeyFor(label)] = w.audio_asset_id;
          if (clipKeyFor(label) === ownChildKey) continue;
          if (w.category === 'pet') {
            prefillExtras.push({ name: label, pet: true });
          } else if (w.category === 'vip') {
            if (FAMILY_CHIPS.includes(label)) prefillChips.push(label);
            else prefillExtras.push({ name: label, pet: false });
          } else if (w.category === 'family') {
            prefillSiblings.push(label);
          }
        }
        setRecorded(found);
        if (prefillSiblings.length) setSiblings(prefillSiblings);
        if (prefillChips.length) setChips(prefillChips);
        if (prefillExtras.length) setExtras(prefillExtras);
      } catch {
        if (mounted) setLoadError('Network error loading this profile.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (profileId) {
      load();
    } else {
      setLoading(false);
    }
    return () => {
      mounted = false;
    };
  }, [profileId]);

  const currentItem: StudioPromptItem | undefined = queue[index];
  const lastIndex = queue.length - 1;

  const chapterItems = (chapterId: number) => queue.filter((i) => i.chapter === chapterId);
  const recordedCount = queue.filter((i) => recorded[i.clipKey]).length;
  const chapter1Done = useMemo(
    () =>
      queue
        .filter((i) => i.chapter === 1)
        .every((i) => Boolean(recorded[i.clipKey]) || skipped.has(i.clipKey)),
    [queue, recorded, skipped]
  );
  const busy = recordState === 'saving';

  // Recording helpers (refs, so async recorder callbacks never see stale state)
  function playUrl(url: string) {
    audioRef.current?.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    try {
      Promise.resolve(audio.play()).catch(() => {});
    } catch {
      // Playback is optional; the recording still saves.
    }
  }

  function discardPending() {
    const current = pendingRef.current;
    if (current) revokeUrl(current.url);
    pendingRef.current = null;
    setPending(null);
  }

  function stopMeter() {
    const { ctx, frame } = meterRef.current;
    if (frame !== null) cancelAnimationFrame(frame);
    ctx?.close?.().catch?.(() => {});
    meterRef.current = { ctx: null, frame: null };
    setLevel(0);
  }

  function startMeter(stream: MediaStream) {
    const AudioCtx = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    try {
      const ctx: AudioContext = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (const v of data) peak = Math.max(peak, Math.abs(v - 128) / 128);
        setLevel(Math.min(1, peak * 2));
        meterRef.current.frame = requestAnimationFrame(tick);
      };
      meterRef.current = { ctx, frame: null };
      tick();
    } catch {
      // The meter is decoration; recording still works without it.
    }
  }

  function cancelRecording() {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder) {
      recorder.onstop = null;
      if (recorder.state !== 'inactive') recorder.stop();
    }
    stopTracks(streamRef.current);
    streamRef.current = null;
    stopMeter();
  }

  function finishRecording() {
    const item = recordItemRef.current;
    const mimeType = recorderRef.current?.mimeType || 'audio/webm';
    const blob = new Blob(chunksRef.current, { type: mimeType });
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
    recorderRef.current = null;
    stopTracks(streamRef.current);
    streamRef.current = null;
    stopMeter();

    if (!item || blob.size === 0) {
      setRecordState('idle');
      setSaveError('Nothing was recorded. Try again.');
      return;
    }
    const url = makeUrl(blob);
    const next = { item, blob, url };
    pendingRef.current = next;
    setPending(next);
    setRecordState('review');
    playUrl(url);
  }

  function stopRecording() {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }

  async function startRecording(item: StudioPromptItem) {
    if (savingRef.current || recorderRef.current) return;
    discardPending();
    setSaveError(null);
    setMicError(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      const denied = err?.name === 'NotAllowedError' || err?.name === 'SecurityError';
      setMicError(denied ? 'denied' : 'unavailable');
      return;
    }

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream);
    } catch {
      stopTracks(stream);
      setMicError('unavailable');
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];
    recordItemRef.current = item;
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => finishRecording();
    recorderRef.current = recorder;
    recorder.start();
    setRecordState('recording');
    startMeter(stream);
    stopTimerRef.current = setTimeout(stopRecording, MAX_RECORD_MS);
  }

  function toggleRecord() {
    if (busy) return;
    if (recordState === 'recording') {
      stopRecording();
    } else if (currentItem) {
      void startRecording(currentItem);
    }
  }

  async function uploadClip(item: StudioPromptItem, blob: Blob): Promise<string | null> {
    try {
      const form = new FormData();
      form.append(
        'file',
        new File([blob], `${item.clipKey}.webm`, { type: blob.type || 'audio/webm' })
      );
      form.append('kind', item.assetKind);
      const upload = await fetch(`/api/profiles/${profileId}/assets`, {
        method: 'POST',
        body: form,
      });
      if (!upload.ok) return null;
      const uploaded: any = await upload.json();
      const assetId: string | undefined = uploaded?.asset?.id;
      if (!assetId) return null;

      if (item.assetKind === 'word-audio') {
        // Same word updates the existing family word, so re-recording replaces the audio.
        const saved = await fetch(`/api/profiles/${profileId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: item.targetWord,
            promptLabel: item.displayWord,
            category: categoryFor(item),
            audioAssetId: assetId,
          }),
        });
        if (!saved.ok) return null;
      } else {
        const saved = await fetch(`/api/profiles/${profileId}/audio-overrides`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clipKey: item.clipKey, assetId }),
        });
        if (!saved.ok) return null;
      }
      return assetId;
    } catch {
      return null;
    }
  }

  async function keepRecording() {
    const current = pendingRef.current;
    if (!current || savingRef.current) return;
    savingRef.current = true;
    setRecordState('saving');
    setSaveError(null);

    const assetId = await uploadClip(current.item, current.blob);
    savingRef.current = false;

    if (!assetId) {
      setRecordState('review');
      setSaveError('That recording did not save. Check your connection, then tap Retry.');
      return;
    }

    setRecorded((prev) => ({ ...prev, [current.item.clipKey]: assetId }));
    setLastSaved(current.item.displayWord);
    discardPending();
    setRecordState('idle');
    goNext(current.item);
  }

  function goToIndex(next: number) {
    cancelRecording();
    discardPending();
    setSaveError(null);
    setMicError(null);
    setRecordState('idle');
    setIndex(Math.max(0, Math.min(next, lastIndex)));
  }

  function goNext(from: StudioPromptItem) {
    const position = queue.findIndex((i) => i.key === from.key);
    if (position >= 0 && position < lastIndex) {
      goToIndex(position + 1);
    } else {
      cancelRecording();
      discardPending();
      setRecordState('idle');
      setView('finish');
    }
  }

  function skipCurrent() {
    if (busy || !currentItem) return;
    setSkipped((prev) => new Set(prev).add(currentItem.clipKey));
    goNext(currentItem);
  }

  function playExample() {
    if (!currentItem) return;
    const url = resolveClipUrl(currentItem.clipKey, {});
    if (url) playUrl(url);
  }

  function playPending() {
    if (pendingRef.current) playUrl(pendingRef.current.url);
  }

  function playRecorded() {
    if (!currentItem) return;
    const assetId = recorded[currentItem.clipKey];
    if (assetId) playUrl(`/api/profiles/${profileId}/assets/${assetId}`);
  }

  // Keyboard: Space records or stops, Enter keeps, R tries again. Ignored while typing or on buttons.
  keyHandlerRef.current = (e: KeyboardEvent) => {
    if (view !== 'studio' || busy) return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag && INTERACTIVE_TAGS.includes(tag)) return;
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      toggleRecord();
    } else if (e.key === 'Enter' && recordState === 'review') {
      e.preventDefault();
      void keepRecording();
    } else if ((e.key === 'r' || e.key === 'R') && recordState !== 'recording' && currentItem) {
      e.preventDefault();
      void startRecording(currentItem);
    }
  };

  useEffect(() => {
    const listener = (e: KeyboardEvent) => keyHandlerRef.current(e);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  useEffect(
    () => () => {
      cancelRecording();
      discardPending();
      audioRef.current?.pause();
    },
    // Runs only on unmount; the cleanup reads refs only.
    []
  );

  // Family step
  function addSibling() {
    const name = siblingInput.replace(/\s+/g, ' ').trim();
    if (!name) return;
    if (!siblings.some((s) => s.toLowerCase() === name.toLowerCase())) {
      setSiblings([...siblings, name]);
    }
    setSiblingInput('');
  }

  function addExtra() {
    const name = extraInput.replace(/\s+/g, ' ').trim();
    if (!name) return;
    if (!extras.some((e) => e.name.toLowerCase() === name.toLowerCase())) {
      setExtras([...extras, { name, pet: extraIsPet }]);
    }
    setExtraInput('');
    setExtraIsPet(false);
  }

  async function continueToStudio() {
    const name = childName.replace(/\s+/g, ' ').trim();
    if (!name || familySaving) return;
    const familyMembers = chips.filter((c) => FAMILY_CHIPS.includes(c));
    const extraPeople = extras.filter((e) => !e.pet).map((e) => e.name);
    const pets = extras.filter((e) => e.pet).map((e) => e.name);

    const people: Array<{ name: string; category: 'family' | 'vip' | 'pet' }> = [
      { name, category: 'family' },
      ...siblings.map((n) => ({ name: n, category: 'family' as const })),
      ...[...familyMembers, ...extraPeople].map((n) => ({ name: n, category: 'vip' as const })),
      ...pets.map((n) => ({ name: n, category: 'pet' as const })),
    ];

    setFamilySaving(true);
    setFamilyError(null);
    try {
      // Save every name now so it is in the game even if it is never recorded.
      for (const person of people) {
        const res = await fetch(`/api/profiles/${profileId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: person.name,
            promptLabel: person.name,
            category: person.category,
          }),
        });
        if (!res.ok) {
          setFamilyError(`We could not save ${person.name}. Check the name and try again.`);
          return;
        }
      }
    } catch {
      setFamilyError('We could not reach Foxwords. Check your connection and try again.');
      return;
    } finally {
      setFamilySaving(false);
    }

    const built = buildStudioQueue({
      childName: name,
      siblings,
      familyMembers: [...familyMembers, ...extraPeople],
      pets,
    });
    setQueue(built);
    setSkipped(new Set());
    setSaveError(null);
    setMicError(null);
    setLastSaved(null);

    const key = new URLSearchParams(window.location.search).get('key');
    const deepLink = key ? built.findIndex((i) => i.clipKey === key) : -1;
    setIndex(deepLink >= 0 ? deepLink : 0);
    setView('studio');
  }

  if (loading) {
    return (
      <Container size="sm" py="xl">
        <Stack gap="md">
          <Loader aria-label="Loading" />
        </Stack>
      </Container>
    );
  }

  if (loadError || !profile) {
    return (
      <Container size="sm" py="xl">
        <Alert color="red" radius="md" role="alert">
          {loadError || 'We could not find this profile.'}
        </Alert>
        <Button component={Link} href="/parent" mt="md" variant="subtle">
          Back to dashboard
        </Button>
      </Container>
    );
  }

  const displayName = childName.trim() || 'your child';

  // Family step
  if (view === 'family') {
    return (
      <Container size="sm" py="xl">
        <Stack gap="lg">
          <Group justify="space-between">
            <Button
              component={Link}
              href={`/parent/profile/${profileId}`}
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={16} />}
            >
              Back to profile
            </Button>
            <Badge color="indigo" size="lg">
              Voice studio setup
            </Badge>
          </Group>

          <Paper p="xl" radius="md" withBorder>
            <Stack gap="xl">
              <div>
                <Title order={2} size="h3">
                  Who&apos;s in {displayName}&apos;s family?
                </Title>
                <Text size="sm" c="dimmed">
                  We will set up the recordings for your family. Recording is quick, and you can
                  skip anything.
                </Text>
              </div>

              <TouchInput
                id="studio-child-name"
                label="Child's name"
                placeholder="e.g. Juniper"
                value={childName}
                onChange={(val) => setChildName(val)}
                uppercase={false}
              />

              <div>
                <Text fw={600} size="sm" mb="xs">
                  Brothers and sisters
                </Text>
                {siblings.length > 0 && (
                  <Stack gap="xs" mb="sm" data-testid="sibling-list">
                    {siblings.map((sib) => (
                      <Group key={sib} justify="space-between">
                        <Badge size="lg" variant="light" color="indigo">
                          {sib}
                        </Badge>
                        <Button
                          size="xs"
                          color="red"
                          variant="subtle"
                          onClick={() => setSiblings(siblings.filter((s) => s !== sib))}
                          aria-label={`Remove ${sib}`}
                        >
                          <IconTrash size={14} />
                        </Button>
                      </Group>
                    ))}
                  </Stack>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addSibling();
                  }}
                >
                  <Group align="flex-end">
                    <TouchInput
                      id="studio-sibling-name"
                      label="Brother or sister's name"
                      placeholder="Type a name, then press Add"
                      value={siblingInput}
                      onChange={(val) => setSiblingInput(val)}
                      uppercase={false}
                    />
                    <Button
                      type="submit"
                      disabled={!siblingInput.trim()}
                      leftSection={<IconPlus size={16} />}
                      className={classes.actionButton}
                      data-testid="add-sibling"
                    >
                      Add
                    </Button>
                  </Group>
                </form>
              </div>

              <div>
                <Text fw={600} size="sm" mb="xs">
                  Who else is in the family?
                </Text>
                <Text size="sm" c="dimmed" mb="sm">
                  Tap everyone who should be in the game.
                </Text>
                <Chip.Group multiple value={chips} onChange={(value) => setChips(value)}>
                  <Group gap="xs" data-testid="family-chips">
                    {FAMILY_CHIPS.map((name) => (
                      <Chip key={name} value={name} data-testid={`family-chip-${name}`}>
                        {name}
                      </Chip>
                    ))}
                  </Group>
                </Chip.Group>
              </div>

              <div>
                <Text fw={600} size="sm" mb="xs">
                  Someone else
                </Text>
                {extras.length > 0 && (
                  <Stack gap="xs" mb="sm" data-testid="extra-list">
                    {extras.map((person) => (
                      <Group key={person.name} justify="space-between">
                        <Badge size="lg" variant="light" color={person.pet ? 'teal' : 'indigo'}>
                          {person.name}
                          {person.pet ? ' (pet)' : ''}
                        </Badge>
                        <Button
                          size="xs"
                          color="red"
                          variant="subtle"
                          onClick={() => setExtras(extras.filter((x) => x !== person))}
                          aria-label={`Remove ${person.name}`}
                        >
                          <IconTrash size={14} />
                        </Button>
                      </Group>
                    ))}
                  </Stack>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addExtra();
                  }}
                >
                  <Stack gap="xs">
                    <Group align="flex-end">
                      <TouchInput
                        id="studio-extra-name"
                        label="Name"
                        placeholder="e.g. Auntie Sue, or Rover"
                        value={extraInput}
                        onChange={(val) => setExtraInput(val)}
                        uppercase={false}
                      />
                      <Button
                        type="submit"
                        disabled={!extraInput.trim()}
                        leftSection={<IconPlus size={16} />}
                        className={classes.actionButton}
                        data-testid="add-extra"
                      >
                        Add someone else
                      </Button>
                    </Group>
                    <Checkbox
                      label="This is a pet"
                      checked={extraIsPet}
                      onChange={(e) => setExtraIsPet(e.currentTarget.checked)}
                    />
                  </Stack>
                </form>
              </div>

              {familyError && (
                <Alert color="red" radius="md" role="alert">
                  {familyError}
                </Alert>
              )}

              <Button
                color="indigo"
                size="md"
                onClick={continueToStudio}
                disabled={!childName.trim() || familySaving}
                loading={familySaving}
                data-testid="family-continue"
              >
                Continue
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    );
  }

  // Finish screen
  if (view === 'finish') {
    return (
      <Container size="sm" py="xl">
        <Paper p="xl" radius="md" withBorder>
          <Stack gap="lg" align="center" ta="center">
            <Badge color="teal" size="lg" leftSection={<IconCheck size={14} />}>
              All set
            </Badge>
            <Title order={1}>{displayName} is ready to play!</Title>
            <Text size="sm" c="dimmed">
              Your family code
            </Text>
            <Text fw={800} size="2.5rem" ff="monospace" data-testid="play-code">
              {profile.playCode}
            </Text>
            <Text size="sm" c="dimmed">
              You have recorded {recordedCount} of {queue.length} prompts. Anything you skipped can
              be recorded any time from the profile page.
            </Text>
            <Stack gap="sm" w="100%" maw={320}>
              <Button component={Link} href={`/play/${profile.playCode}`} size="lg" color="indigo">
                Play now on this device
              </Button>
              <Button
                component={Link}
                href={`/parent/profile/${profileId}/connect`}
                variant="light"
              >
                Connect a tablet
              </Button>
              <Button component={Link} href="/parent" variant="subtle" color="gray">
                Back to dashboard
              </Button>
              <Button variant="subtle" onClick={() => setView('studio')}>
                Keep recording
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // Studio
  const isRecorded = currentItem ? Boolean(recorded[currentItem.clipKey]) : false;
  const hasExample = currentItem ? Boolean(resolveClipUrl(currentItem.clipKey, {})) : false;
  const progressPercent = queue.length ? Math.round((recordedCount / queue.length) * 100) : 0;
  const recordLabel =
    recordState === 'recording'
      ? 'Stop recording'
      : recordState === 'review'
        ? 'Record again'
        : 'Record';

  return (
    <Container size="md" py="xl" className={classes.container}>
      <Group justify="space-between" wrap="nowrap">
        <Button
          onClick={() => {
            goToIndex(index);
            setView('family');
          }}
          variant="subtle"
          color="gray"
          leftSection={<IconArrowLeft size={16} />}
        >
          Adjust family
        </Button>
        {chapter1Done && (
          <Button
            onClick={() => {
              cancelRecording();
              discardPending();
              setRecordState('idle');
              setView('finish');
            }}
            variant="light"
            color="teal"
            size="xs"
          >
            I&apos;ll finish later
          </Button>
        )}
      </Group>

      <div>
        <Group justify="space-between" mb="xs" wrap="nowrap">
          <Text fw={700} data-testid="recorded-count">
            {recordedCount} of {queue.length} recorded
          </Text>
          <Text size="sm" c="dimmed">
            Prompt {index + 1} of {queue.length}
          </Text>
        </Group>
        <Progress
          value={progressPercent}
          color="indigo"
          radius="xl"
          aria-label="Recording progress"
        />
      </div>

      <Group gap="xs" wrap="wrap" aria-label="Chapters">
        {STUDIO_CHAPTERS.map((chapter) => {
          const items = chapterItems(chapter.id);
          const done = items.filter((i) => recorded[i.clipKey]).length;
          const active = currentItem?.chapter === chapter.id;
          return (
            <Button
              key={chapter.id}
              size="xs"
              variant={active ? 'filled' : 'light'}
              color="indigo"
              data-testid={`chapter-${chapter.id}`}
              onClick={() => {
                const first = queue.findIndex((i) => i.chapter === chapter.id);
                if (first >= 0) goToIndex(first);
              }}
            >
              {chapter.id}. {chapter.title}: {done} of {items.length}
            </Button>
          );
        })}
      </Group>

      {currentItem && (
        <Paper
          p="xl"
          radius="md"
          withBorder
          className={classes.cardPrompt}
          data-testid="prompt-card"
        >
          <Group gap="xs">
            <Badge size="md" variant="outline" color="gray">
              {currentItem.hint}
            </Badge>
            {isRecorded && (
              <Badge color="teal" size="md" leftSection={<IconCheck size={14} />}>
                Recorded
              </Badge>
            )}
          </Group>

          <Title order={1} size="3rem" fw={800} c="indigo.8" data-testid="prompt-word">
            {currentItem.displayWord}
          </Title>

          <Text size="lg" c="dimmed" fw={500} data-testid="prompt-instruction">
            {currentItem.instruction}
          </Text>

          {hasExample && (
            <Button
              variant="subtle"
              color="indigo"
              leftSection={<IconVolume size={16} />}
              onClick={playExample}
            >
              Hear an example
            </Button>
          )}
        </Paper>
      )}

      <Stack align="center" gap="md">
        {micError && (
          <Alert
            color="orange"
            radius="md"
            title="Foxwords cannot use your microphone"
            role="alert"
          >
            <Stack gap="xs">
              {micError === 'denied' ? (
                <>
                  <Text size="sm">
                    <strong>Chrome:</strong> click the padlock or the settings icon in the address
                    bar, set Microphone to Allow, then try again.
                  </Text>
                  <Text size="sm">
                    <strong>Safari on a Mac:</strong> open Safari, Settings, Websites, Microphone,
                    and allow this site.
                  </Text>
                  <Text size="sm">
                    <strong>iPad or iPhone:</strong> open Settings, Safari (or Chrome), Microphone,
                    and allow it. Then reload this page.
                  </Text>
                </>
              ) : (
                <Text size="sm">
                  We could not find a microphone. Check that one is connected, then try again.
                </Text>
              )}
              <Group>
                <Button
                  size="xs"
                  variant="filled"
                  color="orange"
                  onClick={() => currentItem && startRecording(currentItem)}
                >
                  Try again
                </Button>
              </Group>
            </Stack>
          </Alert>
        )}

        <button
          type="button"
          className={`${classes.recordButton} ${recordState === 'recording' ? classes.recordingPulse : ''}`}
          style={{
            backgroundColor: recordState === 'recording' ? '#e03131' : '#4f46e5',
            color: '#ffffff',
            border: 'none',
            cursor: busy ? 'default' : 'pointer',
          }}
          onClick={toggleRecord}
          disabled={busy || !currentItem}
          aria-label={recordLabel}
          data-testid="record-button"
        >
          <IconMicrophone size={36} />
        </button>

        <Text size="sm" c="dimmed" ta="center">
          {recordState === 'recording'
            ? 'Recording. It stops by itself after 4 seconds.'
            : recordState === 'review'
              ? 'Listen back, then keep it or try again.'
              : 'Tap the microphone, or press Space, to record.'}
        </Text>

        {recordState === 'recording' && (
          <div
            role="meter"
            aria-label="Microphone level"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(level * 100)}
            className={classes.levelMeter}
            data-testid="level-meter"
          >
            <div className={classes.levelBar} style={{ width: `${Math.round(level * 100)}%` }} />
          </div>
        )}

        {recordState === 'saving' && (
          <Group gap="xs" role="status">
            <Loader size="sm" />
            <Text size="sm">Saving...</Text>
          </Group>
        )}

        {saveError && (
          <Alert color="red" radius="md" role="alert">
            {saveError}
          </Alert>
        )}

        {recordState === 'review' && (
          <Group justify="center" wrap="wrap">
            <Button
              variant="light"
              color="indigo"
              leftSection={<IconPlayerPlay size={16} />}
              onClick={playPending}
            >
              Listen
            </Button>
            <Button
              color="teal"
              onClick={keepRecording}
              data-testid="keep-button"
              aria-keyshortcuts="Enter"
            >
              {saveError ? 'Retry' : 'Keep and next (Enter)'}
            </Button>
            <Button variant="default" onClick={() => currentItem && startRecording(currentItem)}>
              Try again (R)
            </Button>
          </Group>
        )}

        {recordState === 'idle' && isRecorded && (
          <Button
            variant="subtle"
            color="indigo"
            size="xs"
            leftSection={<IconPlayerPlay size={14} />}
            onClick={playRecorded}
          >
            Play my recording
          </Button>
        )}

        {lastSaved && recordState === 'idle' && (
          <Text size="sm" c="teal" role="status" data-testid="last-saved">
            <IconCheck size={14} style={{ verticalAlign: 'middle' }} /> Saved {lastSaved}
          </Text>
        )}

        <Group justify="space-between" w="100%" mt="md">
          <Button
            variant="subtle"
            color="gray"
            onClick={() => goToIndex(index - 1)}
            disabled={index === 0 || busy}
            leftSection={<IconArrowLeft size={16} />}
          >
            Previous
          </Button>
          <Button variant="subtle" color="gray" onClick={skipCurrent} disabled={busy}>
            Skip this one
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
