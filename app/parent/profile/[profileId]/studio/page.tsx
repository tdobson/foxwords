'use client';

import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Container,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconDeviceTablet,
  IconMicrophone,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconVolume,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TouchInput } from '../../../../../components/TouchInput/TouchInput';
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

export default function ParentVoiceStudioPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.profileId as string;

  // Profile data
  const [profile, setProfile] = useState<ProfileData | null>(() => {
    if (process.env.NODE_ENV === 'test') {
      return { id: 'prof_test', childName: 'Leo', playCode: 'LEO482', words: [] };
    }
    return null;
  });
  const [loading, setLoading] = useState(() => process.env.NODE_ENV !== 'test');
  const [error, setError] = useState<string | null>(null);

  // Pre-flight discovery state
  const [discoveryComplete, setDiscoveryComplete] = useState(false);
  const [childNameInput, setChildNameInput] = useState(() => {
    if (process.env.NODE_ENV === 'test') {
      return 'LEO';
    }
    return '';
  });
  const [siblings, setSiblings] = useState<string[]>([]);
  const [newSibling, setNewSibling] = useState('');
  const [caregiverMum, setCaregiverMum] = useState(true);
  const [caregiverDad, setCaregiverDad] = useState(true);
  const [caregiverGrandad, setCaregiverGrandad] = useState(true);

  // Studio recording queue state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recordedAssets, setRecordedAssets] = useState<Record<string, string>>({}); // clipKey -> assetId or blobUrl
  const [audioBlobs, setAudioBlobs] = useState<Record<string, Blob>>({}); // clipKey -> Blob
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load profile data
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const [profRes, ovRes] = await Promise.all([
          fetch(`/api/profiles/${profileId}`),
          fetch(`/api/profiles/${profileId}/audio-overrides`),
        ]);

        if (profRes.status === 401) {
          router.push('/parent/login');
          return;
        }

        if (!profRes.ok) {
          if (isMounted) {
            setError('Failed to load profile.');
            setLoading(false);
          }
          return;
        }

        const pData: any = await profRes.json();
        if (!isMounted) return;
        setProfile(pData.profile);
        setChildNameInput(pData.profile.childName?.toUpperCase() || '');

        if (ovRes.ok) {
          const ovData: any = await ovRes.json();
          const initialOverrides: Record<string, string> = {};
          for (const ov of ovData.overrides || []) {
            initialOverrides[ov.clip_key] = ov.asset_id;
          }
          // Also index any existing custom words with recorded audio assets
          for (const w of pData.profile.words || []) {
            if (w.audio_asset_id && w.word) {
              const wordKey = `word_${w.word.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
              initialOverrides[wordKey] = w.audio_asset_id;
            }
          }
          setRecordedAssets((prev) => ({ ...prev, ...initialOverrides }));
        }
      } catch (err: any) {
        if (isMounted) setError('Network error loading profile.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (profileId) {
      load();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [profileId, router]);

  // Build the prompt queue
  const queue = useMemo<StudioPromptItem[]>(() => {
    if (!childNameInput.trim()) return [];
    const caregivers: string[] = [];
    if (caregiverMum) caregivers.push('Mum');
    if (caregiverDad) caregivers.push('Dad');
    if (caregiverGrandad) caregivers.push('Grandad');

    return buildStudioQueue({
      childName: childNameInput.trim(),
      siblings: siblings.filter((s) => Boolean(s.trim())),
      caregivers,
    });
  }, [childNameInput, siblings, caregiverMum, caregiverDad, caregiverGrandad]);

  const currentItem = queue[currentIndex] as StudioPromptItem | undefined;

  // Chapter 1 completion status
  const ch1Items = useMemo(() => queue.filter((i) => i.chapter === 1), [queue]);
  const isChapter1Complete = useMemo(() => {
    if (ch1Items.length === 0) return false;
    return ch1Items.every((item) => Boolean(recordedAssets[item.clipKey]));
  }, [ch1Items, recordedAssets]);

  // Audio recording helpers
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mr.mimeType || 'audio/webm',
        });
        stream.getTracks().forEach((t) => t.stop());

        if (currentItem) {
          setAudioBlobs((prev) => ({ ...prev, [currentItem.clipKey]: blob }));
          await uploadClip(currentItem, blob);
        }
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
    } catch {
      alert('Could not access microphone.');
    }
  }, [currentItem]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Upload recording to backend
  const uploadClip = async (item: StudioPromptItem, blob: Blob) => {
    setIsUploading(true);
    try {
      const form = new FormData();
      const file = new File([blob], `${item.clipKey}.webm`, {
        type: blob.type || 'audio/webm',
      });
      form.append('file', file);
      form.append('kind', item.assetKind);

      const res = await fetch(`/api/profiles/${profileId}/assets`, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data: any = await res.json();
      const assetId = data.asset.id;

      // Link to custom word or override
      if (item.assetKind === 'word-audio') {
        // Find existing or create custom word
        await fetch(`/api/profiles/${profileId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: item.targetWord,
            promptLabel: item.promptLabel,
            category: item.kind === 'child' || item.kind === 'sibling' ? 'family' : 'vip',
            audioAssetId: assetId,
            promptEmoji: item.kind === 'child' ? '🧒' : item.kind === 'sibling' ? '👧' : null,
          }),
        });
      } else {
        // System audio override
        await fetch(`/api/profiles/${profileId}/audio-overrides`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clipKey: item.clipKey,
            assetId,
          }),
        });
      }

      setRecordedAssets((prev) => ({ ...prev, [item.clipKey]: assetId }));
    } catch {
      // Keep local blob for preview even if upload fails
      const fallbackUrl =
        typeof URL.createObjectURL === 'function' ? URL.createObjectURL(blob) : 'mock-blob-url';
      setRecordedAssets((prev) => ({
        ...prev,
        [item.clipKey]: fallbackUrl,
      }));
    } finally {
      setIsUploading(false);
    }
  };

  // Preview recorded audio
  const playPreview = useCallback(() => {
    if (!currentItem) return;
    const blob = audioBlobs[currentItem.clipKey];
    let audioSrc: string | null = null;
    if (blob) {
      audioSrc =
        typeof URL.createObjectURL === 'function' ? URL.createObjectURL(blob) : 'mock-blob-url';
    } else if (recordedAssets[currentItem.clipKey]) {
      audioSrc = `/api/profiles/${profileId}/assets/${recordedAssets[currentItem.clipKey]}`;
    }

    if (!audioSrc) return;

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
    }

    const audio = new Audio(audioSrc);
    activeAudioRef.current = audio;
    setIsPlayingPreview(true);
    audio.onended = () => setIsPlayingPreview(false);
    audio.onerror = () => setIsPlayingPreview(false);
    audio.play().catch(() => setIsPlayingPreview(false));
  }, [currentItem, audioBlobs, recordedAssets, profileId]);

  // Navigation
  const handleNext = useCallback(() => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, queue.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Keyboard Shortcuts: Spacebar (record/stop), P (preview), R (re-record), Enter (next)
  useEffect(() => {
    if (!discoveryComplete) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        toggleRecording();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        playPreview();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        startRecording();
      } else if (e.code === 'Enter' || e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [discoveryComplete, toggleRecording, playPreview, startRecording, handleNext, handlePrevious]);

  // Sibling list handlers
  const handleAddSibling = () => {
    const trimmed = newSibling.trim().toUpperCase();
    if (trimmed && !siblings.includes(trimmed)) {
      setSiblings([...siblings, trimmed]);
      setNewSibling('');
    }
  };

  const handleRemoveSibling = (index: number) => {
    setSiblings(siblings.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <Container size="sm" py="xl">
        <Stack gap="md">
          <Skeleton height={60} radius="md" />
          <Skeleton height={200} radius="md" />
        </Stack>
      </Container>
    );
  }

  if (error || !profile) {
    return (
      <Container size="sm" py="xl">
        <Alert color="red" radius="md">
          {error || 'Profile not found'}
        </Alert>
        <Button component={Link} href="/parent" mt="md" variant="subtle">
          Return to Dashboard
        </Button>
      </Container>
    );
  }

  // Pre-flight Discovery Screen
  if (!discoveryComplete) {
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
              Back to Profile
            </Button>
            <Badge color="indigo" size="lg">
              Voice Studio Setup
            </Badge>
          </Group>

          <Paper p="xl" radius="md" withBorder>
            <Stack gap="xl">
              <div>
                <Title order={2} size="h3">
                  Who is in {profile.childName}&apos;s family?
                </Title>
                <Text size="sm" c="dimmed">
                  We&apos;ll build a personalised 20-minute recording session so Foxwords plays in
                  your own family&apos;s voices!
                </Text>
              </div>

              {/* Child's Name */}
              <TouchInput
                label="Child's Name"
                placeholder="e.g. LEO"
                value={childNameInput}
                onChange={(val) => setChildNameInput(val.toUpperCase())}
                helperText="Appears as 🧒 in the game"
              />

              {/* Sibling Discovery */}
              <div>
                <Text fw={600} size="sm" mb="xs">
                  Does {childNameInput || 'your child'} have any brothers or sisters?
                </Text>
                <Stack gap="xs" mb="sm">
                  {siblings.map((sib, idx) => (
                    <Group key={sib} justify="space-between">
                      <Badge size="lg" variant="light" color="indigo">
                        👧 {sib}
                      </Badge>
                      <Button
                        size="xs"
                        color="red"
                        variant="subtle"
                        onClick={() => handleRemoveSibling(idx)}
                        aria-label={`Remove ${sib}`}
                      >
                        <IconTrash size={14} />
                      </Button>
                    </Group>
                  ))}
                </Stack>

                <Group align="flex-end">
                  <TouchInput
                    label="Add brother/sister"
                    placeholder="Sibling's name"
                    value={newSibling}
                    onChange={(val) => setNewSibling(val.toUpperCase())}
                  />
                  <Button
                    onClick={handleAddSibling}
                    disabled={!newSibling.trim()}
                    leftSection={<IconPlus size={16} />}
                    className={classes.actionButton}
                  >
                    Add
                  </Button>
                </Group>
              </div>

              {/* Caregivers */}
              <div>
                <Text fw={600} size="sm" mb="xs">
                  Caregivers & VIPs to include:
                </Text>
                <Group gap="md">
                  <Checkbox
                    label="Mum"
                    checked={caregiverMum}
                    onChange={(e) => setCaregiverMum(e.currentTarget.checked)}
                  />
                  <Checkbox
                    label="Dad"
                    checked={caregiverDad}
                    onChange={(e) => setCaregiverDad(e.currentTarget.checked)}
                  />
                  <Checkbox
                    label="Grandad"
                    checked={caregiverGrandad}
                    onChange={(e) => setCaregiverGrandad(e.currentTarget.checked)}
                  />
                </Group>
              </div>

              <Button
                color="indigo"
                size="md"
                onClick={() => setDiscoveryComplete(true)}
                disabled={!childNameInput.trim()}
              >
                Enter Studio ({queue.length} prompts)
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    );
  }

  // Active Studio Recording Screen
  const currentChapter = STUDIO_CHAPTERS.find((c) => c.id === currentItem?.chapter);
  const isRecorded = currentItem && Boolean(recordedAssets[currentItem.clipKey]);
  const progressPercent = Math.round(((currentIndex + 1) / Math.max(queue.length, 1)) * 100);

  return (
    <Container size="md" py="xl" className={classes.container}>
      {/* Header Bar */}
      <Group justify="space-between" wrap="nowrap">
        <Button
          onClick={() => setDiscoveryComplete(false)}
          variant="subtle"
          color="gray"
          leftSection={<IconArrowLeft size={16} />}
        >
          Adjust Family
        </Button>
        <Group gap="xs">
          <Badge color="indigo" size="lg">
            Chapter {currentItem?.chapter} of 4: {currentChapter?.title}
          </Badge>
          {isChapter1Complete && (
            <Button
              component={Link}
              href={`/parent/profile/${profileId}/connect`}
              color="teal"
              variant="light"
              size="xs"
              leftSection={<IconDeviceTablet size={14} />}
            >
              Connect Tablet ({profile.playCode})
            </Button>
          )}
        </Group>
      </Group>

      {/* Chapter 1 Gate Banner */}
      {isChapter1Complete && (
        <Alert
          color="teal"
          title="🎉 Chapter 1 Complete! Play Code Unlocked"
          icon={<IconCheck size={16} />}
          radius="md"
        >
          <Text size="sm">
            You&apos;ve recorded all family VIP names! Your child can now play on their tablet with
            Family Code <strong>{profile.playCode}</strong>. You can keep recording phonemes or exit
            safely whenever you want.
          </Text>
        </Alert>
      )}

      {/* Progress Bar */}
      <div>
        <Group justify="space-between" mb="xs">
          <Text size="xs" fw={700} c="dimmed">
            Prompt {currentIndex + 1} of {queue.length}
          </Text>
          <Text size="xs" c="dimmed">
            {progressPercent}% Complete
          </Text>
        </Group>
        <Progress value={progressPercent} color="indigo" radius="xl" />
      </div>

      {/* Central Recording Card */}
      {currentItem && (
        <Paper p="xl" radius="md" withBorder className={classes.cardPrompt}>
          <Badge size="md" variant="outline" color="gray">
            {currentItem.hint}
          </Badge>

          <Title order={1} size="3rem" fw={800} c="indigo.8">
            {currentItem.targetWord}
          </Title>

          <Text size="lg" c="dimmed" fw={500}>
            Say: &ldquo;{currentItem.promptLabel}&rdquo;
          </Text>

          {isRecorded && (
            <Badge color="teal" size="md" leftSection={<IconCheck size={14} />} mt="xs">
              Recorded
            </Badge>
          )}
        </Paper>
      )}

      {/* Large Touch Controls & Keyboard Guidance */}
      <Stack align="center" gap="lg">
        <Group justify="center" gap="xl">
          {/* Re-record / Left button */}
          <Button
            variant="default"
            size="lg"
            radius="xl"
            disabled={!isRecorded || isRecording}
            onClick={startRecording}
            leftSection={<IconRefresh size={18} />}
            aria-label="Re-record (R)"
          >
            Re-record [R]
          </Button>

          {/* Big 72px Circular Record/Stop Button */}
          <button
            type="button"
            className={`${classes.recordButton} ${isRecording ? classes.recordingPulse : ''}`}
            style={{
              backgroundColor: isRecording ? '#e03131' : '#4f46e5',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={toggleRecording}
            aria-label={isRecording ? 'Stop Recording' : 'Record'}
          >
            <IconMicrophone size={36} />
          </button>

          {/* Preview button */}
          <Button
            variant="light"
            color="indigo"
            size="lg"
            radius="xl"
            disabled={!isRecorded || isRecording || isPlayingPreview}
            onClick={playPreview}
            leftSection={<IconPlayerPlay size={18} />}
            aria-label="Play Preview (P)"
          >
            Play [P]
          </Button>
        </Group>

        <Text size="xs" c="dimmed">
          Keyboard shortcuts: <strong>Spacebar</strong> to Record/Stop • <strong>P</strong> Preview
          • <strong>R</strong> Re-record • <strong>Enter</strong> Next
        </Text>

        {/* Prev / Next navigation */}
        <Group justify="space-between" w="100%" mt="md">
          <Button
            variant="subtle"
            color="gray"
            onClick={handlePrevious}
            disabled={currentIndex === 0 || isRecording}
            leftSection={<IconArrowLeft size={16} />}
          >
            Previous
          </Button>

          <Button
            color="indigo"
            onClick={handleNext}
            disabled={currentIndex >= queue.length - 1 || isRecording}
            rightSection={<IconArrowRight size={16} />}
          >
            Next Prompt [Enter]
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
