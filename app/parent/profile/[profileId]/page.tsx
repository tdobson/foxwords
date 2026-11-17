'use client';

import {
  Alert,
  Badge,
  Button,
  Container,
  FileInput,
  Group,
  Modal,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCheck,
  IconDeviceTablet,
  IconMicrophone,
  IconMicrophoneOff,
  IconPhoto,
  IconPlayerPlay,
  IconPlus,
  IconTrash,
  IconVolume,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildStudioQueue,
  STUDIO_CHAPTERS,
  type StudioPromptItem,
} from '../../../../lib/play/studio-queue';

interface CustomWord {
  id: string;
  word: string;
  category: 'vip' | 'family' | 'pet' | 'toy' | 'custom';
  prompt_label: string;
  prompt_emoji?: string | null;
  photo_asset_id?: string | null;
  audio_asset_id?: string | null;
}

interface AudioOverride {
  id: string;
  clip_key: string;
  asset_id: string;
}

interface VoiceRow {
  clipKey: string;
  label: string;
  chapter: number | null;
  assetId: string;
  wordId?: string;
  overrideClipKey?: string;
}

const DEFAULT_CAREGIVERS = ['Mum', 'Dad', 'Grandad'];

const wordClipKey = (word: string) => `word_${word.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

const humanise = (clipKey: string) => clipKey.replace(/_/g, ' ');

export default function ProfileCustomiserPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.profileId as string;

  const [childName, setChildName] = useState('');
  const [playCode, setPlayCode] = useState('');
  const [words, setWords] = useState<CustomWord[]>([]);
  const [overrides, setOverrides] = useState<AudioOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Word Modal
  const [addWordOpened, setAddWordOpened] = useState(false);
  const [wordInput, setWordInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<string>('family');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [submittingWord, setSubmittingWord] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, ovRes] = await Promise.all([
        fetch(`/api/profiles/${profileId}`),
        fetch(`/api/profiles/${profileId}/audio-overrides`),
      ]);

      if (pRes.status === 401) {
        router.push('/parent/login');
        return;
      }

      if (!pRes.ok) {
        setError('Could not load this Foxwords space. Please try again.');
        return;
      }

      const pData: any = await pRes.json();
      setChildName(pData.profile.childName);
      setPlayCode(pData.profile.playCode);
      setWords(pData.profile.words || []);

      if (ovRes.ok) {
        const ovData: any = await ovRes.json();
        setOverrides(ovData.overrides || []);
      }
    } catch {
      setError('Network error loading this Foxwords space.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profileId) {
      fetchProfileData();
    }
  }, [profileId]);

  const studio = useMemo(() => {
    const queue: StudioPromptItem[] = childName.trim()
      ? buildStudioQueue({
          childName: childName.trim(),
          siblings: words.filter((w) => w.category === 'family').map((w) => w.prompt_label),
          caregivers: DEFAULT_CAREGIVERS,
        })
      : [];
    const queueByKey = new Map(queue.map((item) => [item.clipKey, item]));

    const assetByClipKey = new Map<string, string>();
    for (const ov of overrides) {
      assetByClipKey.set(ov.clip_key, ov.asset_id);
    }
    for (const w of words) {
      if (w.audio_asset_id) {
        assetByClipKey.set(wordClipKey(w.word), w.audio_asset_id);
      }
    }

    const promptKeys = new Set<string>([
      ...queue.map((item) => item.clipKey),
      ...words.map((w) => wordClipKey(w.word)),
    ]);
    const recordedCount = [...promptKeys].filter((key) => assetByClipKey.has(key)).length;

    const rows: VoiceRow[] = [];
    const seen = new Set<string>();
    for (const w of words) {
      if (!w.audio_asset_id) continue;
      const clipKey = wordClipKey(w.word);
      if (seen.has(clipKey)) continue;
      seen.add(clipKey);
      rows.push({
        clipKey,
        label: w.prompt_label,
        chapter: queueByKey.get(clipKey)?.chapter ?? null,
        assetId: w.audio_asset_id,
        wordId: w.id,
      });
    }
    for (const ov of overrides) {
      if (seen.has(ov.clip_key)) continue;
      seen.add(ov.clip_key);
      const item = queueByKey.get(ov.clip_key);
      rows.push({
        clipKey: ov.clip_key,
        label: item?.promptLabel ?? humanise(ov.clip_key),
        chapter: item?.chapter ?? null,
        assetId: ov.asset_id,
        overrideClipKey: ov.clip_key,
      });
    }

    const groups = [
      ...STUDIO_CHAPTERS.map((chapter) => ({
        key: `chapter-${chapter.id}`,
        title: chapter.title,
        rows: rows.filter((row) => row.chapter === chapter.id),
      })),
      { key: 'other', title: 'Other voices', rows: rows.filter((row) => row.chapter === null) },
    ].filter((group) => group.rows.length > 0);

    return {
      total: promptKeys.size,
      recorded: recordedCount,
      rows,
      groups,
    };
  }, [childName, words, overrides]);

  const hasFamilyNames = words.some((w) => ['vip', 'family', 'pet'].includes(w.category));
  const familyNameCount = words.filter((w) => ['vip', 'family', 'pet'].includes(w.category)).length;
  const familyStepDone = hasFamilyNames;
  const voicesStepDone = studio.total > 0 && studio.recorded >= studio.total;
  const deviceStepReady = familyStepDone && studio.recorded > 0;

  // Audio Recording helpers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType || 'audio/webm' });
        setRecordedAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
    } catch {
      alert('Could not access the microphone. Check that Foxwords is allowed to use it.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetAddWordForm = () => {
    setWordInput('');
    setLabelInput('');
    setCategoryInput('family');
    setPhotoFile(null);
    setRecordedAudioBlob(null);
  };

  const handleCreateWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordInput.trim() || !labelInput.trim()) return;
    setSubmittingWord(true);

    try {
      let photoAssetId: string | null = null;
      let audioAssetId: string | null = null;

      if (photoFile) {
        const pForm = new FormData();
        pForm.append('file', photoFile);
        pForm.append('kind', 'photo');
        const pRes = await fetch(`/api/profiles/${profileId}/assets`, {
          method: 'POST',
          body: pForm,
        });
        if (pRes.ok) {
          const pAssetData: any = await pRes.json();
          photoAssetId = pAssetData.asset.id;
        }
      }

      if (recordedAudioBlob) {
        const aForm = new FormData();
        const aFile = new File([recordedAudioBlob], 'recording.webm', {
          type: recordedAudioBlob.type,
        });
        aForm.append('file', aFile);
        aForm.append('kind', 'word-audio');
        const aRes = await fetch(`/api/profiles/${profileId}/assets`, {
          method: 'POST',
          body: aForm,
        });
        if (aRes.ok) {
          const aAssetData: any = await aRes.json();
          audioAssetId = aAssetData.asset.id;
        }
      }

      const res = await fetch(`/api/profiles/${profileId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: wordInput.trim().toUpperCase(),
          promptLabel: labelInput.trim(),
          category: categoryInput,
          photoAssetId,
          audioAssetId,
        }),
      });

      if (res.ok) {
        resetAddWordForm();
        setAddWordOpened(false);
        fetchProfileData();
      } else {
        const data: any = await res.json();
        alert(data?.error?.message || 'Could not add that name. Please try again.');
      }
    } catch {
      alert('Something went wrong saving that name. Please try again.');
    } finally {
      setSubmittingWord(false);
    }
  };

  const handleDeleteWord = async (wordId: string, label: string) => {
    if (!confirm(`Remove ${label} from this Foxwords? Any voice recorded for them goes too.`))
      return;
    try {
      const res = await fetch(`/api/profiles/${profileId}/items/${wordId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setWords((prev) => prev.filter((w) => w.id !== wordId));
      } else {
        alert('Could not remove that name.');
      }
    } catch {
      alert('Something went wrong removing that name.');
    }
  };

  const handleClearOverride = async (clipKey: string) => {
    if (
      !confirm('Remove this recorded voice? The game will use the spelling until you record again.')
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/profiles/${profileId}/audio-overrides`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clipKey }),
      });
      if (res.ok) {
        setOverrides((prev) => prev.filter((o) => o.clip_key !== clipKey));
      } else {
        alert('Could not remove that voice.');
      }
    } catch {
      alert('Something went wrong removing that voice.');
    }
  };

  const playVoice = (assetId: string) => {
    const audio = new Audio(`/api/profiles/${profileId}/assets/${assetId}`);
    audio.play().catch(() => alert('Could not play that voice.'));
  };

  const removeVoice = (row: VoiceRow) => {
    if (row.wordId) {
      handleDeleteWord(row.wordId, row.label);
    } else if (row.overrideClipKey) {
      handleClearOverride(row.overrideClipKey);
    }
  };

  const studioHref = (clipKey?: string) =>
    `/parent/profile/${profileId}/studio${clipKey ? `?key=${encodeURIComponent(clipKey)}` : ''}`;

  return (
    <Container size="md" py="xl" data-testid="profile-customiser-screen">
      <Group justify="space-between" mb="xl">
        <Button
          component={Link}
          href="/parent"
          variant="subtle"
          color="gray"
          leftSection={<IconArrowLeft size={16} />}
          data-testid="back-to-dashboard-btn"
        >
          Your Foxwords
        </Button>
        <Button
          component={Link}
          href={`/play/${playCode}`}
          color="indigo"
          variant="light"
          leftSection={<IconPlayerPlay size={16} />}
          disabled={!playCode}
          data-testid="play-now-btn"
        >
          Play now
        </Button>
      </Group>

      {error && (
        <Alert color="red" mb="lg" radius="md" role="alert">
          {error}
        </Alert>
      )}

      {loading ? (
        <Stack gap="md">
          <Skeleton height={120} radius="md" />
          <Skeleton height={200} radius="md" />
        </Stack>
      ) : (
        <Stack gap="xl">
          <div>
            <Title order={1} size="h2">
              {childName}&apos;s Foxwords
            </Title>
            <Text size="sm" c="dimmed">
              Play code{' '}
              <Badge color="indigo" data-testid="play-code">
                {playCode}
              </Badge>
            </Text>
          </div>

          <Paper p="lg" radius="md" withBorder data-testid="setup-checklist">
            <Title order={2} size="h4" mb="md">
              Get {childName} playing in three steps
            </Title>
            <Stack gap="md">
              <ChecklistStep
                number={1}
                title="Family names added"
                detail={
                  familyStepDone
                    ? `${familyNameCount} ${familyNameCount === 1 ? 'name' : 'names'} added, like Mum, Dad or a pet`
                    : 'Add Mum, Dad, grandparents, siblings or pets'
                }
                status={familyStepDone ? 'Done' : 'To do'}
                done={familyStepDone}
                action={
                  <Button
                    color="indigo"
                    size="xs"
                    leftSection={<IconPlus size={14} />}
                    onClick={() => setAddWordOpened(true)}
                    data-testid="checklist-add-names-btn"
                  >
                    {familyStepDone ? 'Add another name' : 'Add family names'}
                  </Button>
                }
                testId="checklist-step-names"
              />
              <ChecklistStep
                number={2}
                title="Voices recorded"
                detail={`${studio.recorded} of ${studio.total} recorded`}
                status={voicesStepDone ? 'Done' : studio.recorded > 0 ? 'In progress' : 'To do'}
                done={voicesStepDone}
                action={
                  <Button
                    component={Link}
                    href={studioHref()}
                    color="indigo"
                    size="xs"
                    leftSection={<IconMicrophone size={14} />}
                    data-testid="checklist-record-btn"
                  >
                    {studio.recorded > 0 ? 'Keep recording' : 'Record voices'}
                  </Button>
                }
                testId="checklist-step-voices"
              />
              <ChecklistStep
                number={3}
                title="Playing on a device"
                detail={
                  deviceStepReady
                    ? 'Open the play link or scan the QR code on a tablet or laptop'
                    : 'Finish steps 1 and 2, then open the game on a tablet or laptop'
                }
                status={deviceStepReady ? 'Ready' : 'Not yet'}
                done={deviceStepReady}
                action={
                  <Button
                    component={Link}
                    href={`/parent/profile/${profileId}/connect`}
                    color="teal"
                    size="xs"
                    leftSection={<IconDeviceTablet size={14} />}
                    data-testid="checklist-connect-btn"
                  >
                    Connect a device
                  </Button>
                }
                testId="checklist-step-device"
              />
            </Stack>
          </Paper>

          <div>
            <Group justify="space-between" mb="md">
              <Title order={2} size="h4">
                Family, people and pet names
              </Title>
            </Group>

            {words.length === 0 ? (
              <Paper p="md" radius="md" withBorder ta="center">
                <Text c="dimmed" size="sm">
                  No names yet. Add Mum, Dad, grandparents, pets or a favourite toy.
                </Text>
              </Paper>
            ) : (
              <Table withTableBorder withColumnBorders data-testid="custom-words-table">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Spelling</Table.Th>
                    <Table.Th>Shown as</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Photo</Table.Th>
                    <Table.Th>Voice</Table.Th>
                    <Table.Th style={{ width: 60 }} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {words.map((w) => (
                    <Table.Tr key={w.id}>
                      <Table.Td fw={700}>{w.word}</Table.Td>
                      <Table.Td>{w.prompt_label}</Table.Td>
                      <Table.Td>
                        <Badge size="xs" variant="outline">
                          {categoryLabel(w.category)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {w.photo_asset_id ? (
                          <Badge color="green" size="xs">
                            Own photo
                          </Badge>
                        ) : (
                          <Text size="xs" c="dimmed">
                            Default
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {w.audio_asset_id ? (
                          <Badge color="blue" size="xs">
                            Recorded
                          </Badge>
                        ) : (
                          <Text size="xs" c="dimmed">
                            Not recorded
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Button
                          variant="subtle"
                          color="red"
                          size="xs"
                          aria-label={`Remove ${w.prompt_label}`}
                          onClick={() => handleDeleteWord(w.id, w.prompt_label)}
                        >
                          <IconTrash size={14} />
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </div>

          <div>
            <Title order={2} size="h4" mb="xs">
              Recorded voices
            </Title>
            <Text size="sm" c="dimmed" mb="md">
              Play a voice to check it, record it again, or remove it. Anything not recorded yet
              uses the standard voice.
            </Text>

            {studio.groups.length === 0 ? (
              <Paper p="md" radius="md" withBorder ta="center" data-testid="no-recorded-voices">
                <Text c="dimmed" size="sm">
                  No family voices yet. Start with {childName}&apos;s name in Record voices.
                </Text>
              </Paper>
            ) : (
              <Stack gap="lg" data-testid="recorded-voices">
                {studio.groups.map((group) => (
                  <div key={group.key} data-testid={`voice-group-${group.key}`}>
                    <Title order={3} size="h5" mb="xs">
                      {group.title}
                    </Title>
                    <Stack gap="xs">
                      {group.rows.map((row) => (
                        <Paper
                          key={row.clipKey}
                          p="sm"
                          radius="md"
                          withBorder
                          data-testid="voice-row"
                        >
                          <Group justify="space-between" wrap="nowrap">
                            <Group gap="xs" wrap="nowrap">
                              <IconCheck size={16} color="var(--mantine-color-teal-6)" />
                              <Text size="sm" fw={600}>
                                {row.label}
                              </Text>
                            </Group>
                            <Group gap="xs" wrap="nowrap">
                              <Button
                                variant="light"
                                color="indigo"
                                size="xs"
                                aria-label={`Play ${row.label}`}
                                leftSection={<IconVolume size={14} />}
                                onClick={() => playVoice(row.assetId)}
                              >
                                Play
                              </Button>
                              <Button
                                component={Link}
                                href={studioHref(row.clipKey)}
                                variant="default"
                                size="xs"
                                aria-label={`Record ${row.label} again`}
                                leftSection={<IconMicrophone size={14} />}
                              >
                                Re-record
                              </Button>
                              <Button
                                variant="subtle"
                                color="red"
                                size="xs"
                                aria-label={`Remove ${row.label} voice`}
                                leftSection={<IconMicrophoneOff size={14} />}
                                onClick={() => removeVoice(row)}
                              >
                                Remove
                              </Button>
                            </Group>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  </div>
                ))}
              </Stack>
            )}
          </div>
        </Stack>
      )}

      <Modal
        opened={addWordOpened}
        onClose={() => setAddWordOpened(false)}
        title="Add a family name"
        centered
      >
        <form onSubmit={handleCreateWord} data-testid="add-word-form">
          <Stack gap="md">
            <TextInput
              label="Spelling (letters only)"
              description="How the word is spelled in the game, e.g. MUM or ROVER"
              placeholder="MUM"
              required
              autoFocus
              value={wordInput}
              onChange={(e) => setWordInput(e.currentTarget.value.toUpperCase())}
              data-testid="add-word-spelling"
            />
            <TextInput
              label="Name to show"
              description="How it appears on screen, e.g. Mum or Rover"
              placeholder="Mum"
              required
              value={labelInput}
              onChange={(e) => setLabelInput(e.currentTarget.value)}
              data-testid="add-word-label"
            />
            <Select
              label="Who or what is it?"
              allowDeselect={false}
              data={[
                { value: 'vip', label: 'Grown-up (Mum, Dad, Grandad)' },
                { value: 'family', label: 'Brother, sister or other family' },
                { value: 'pet', label: 'Pet' },
                { value: 'toy', label: 'Favourite toy' },
                { value: 'custom', label: 'Something else' },
              ]}
              value={categoryInput}
              onChange={(val) => setCategoryInput(val || 'custom')}
              data-testid="add-word-category"
            />
            <FileInput
              label="Photo (optional)"
              placeholder="Pick a JPEG, PNG or WebP"
              accept="image/jpeg,image/png,image/webp"
              leftSection={<IconPhoto size={16} />}
              value={photoFile}
              onChange={setPhotoFile}
              data-testid="add-word-photo"
            />

            <div>
              <Text size="sm" fw={500} mb="xs">
                Voice (optional)
              </Text>
              <Group>
                {!isRecording ? (
                  <Button
                    variant="light"
                    color="indigo"
                    size="sm"
                    onClick={startRecording}
                    leftSection={<IconMicrophone size={16} />}
                    data-testid="add-word-start-recording"
                  >
                    Record a voice
                  </Button>
                ) : (
                  <Button
                    variant="filled"
                    color="red"
                    size="sm"
                    onClick={stopRecording}
                    leftSection={<IconMicrophoneOff size={16} />}
                    data-testid="add-word-stop-recording"
                  >
                    Stop recording
                  </Button>
                )}

                {recordedAudioBlob && (
                  <Badge color="green" leftSection={<IconVolume size={12} />}>
                    Voice recorded
                  </Badge>
                )}
              </Group>
            </div>

            <Button
              type="submit"
              color="indigo"
              loading={submittingWord}
              disabled={!wordInput.trim() || !labelInput.trim()}
              data-testid="add-word-submit"
            >
              Add to {childName}&apos;s Foxwords
            </Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}

function categoryLabel(category: CustomWord['category']): string {
  switch (category) {
    case 'vip':
      return 'Grown-up';
    case 'family':
      return 'Family';
    case 'pet':
      return 'Pet';
    case 'toy':
      return 'Toy';
    default:
      return 'Other';
  }
}

function ChecklistStep({
  number,
  title,
  detail,
  status,
  done,
  action,
  testId,
}: {
  number: number;
  title: string;
  detail: string;
  status: string;
  done: boolean;
  action: React.ReactNode;
  testId: string;
}) {
  return (
    <Group justify="space-between" align="center" wrap="nowrap" data-testid={testId}>
      <Group wrap="nowrap" align="flex-start" style={{ flex: 1 }}>
        <Badge
          circle
          size="lg"
          color={done ? 'teal' : 'gray'}
          variant={done ? 'filled' : 'light'}
          aria-hidden="true"
        >
          {number}
        </Badge>
        <div>
          <Text fw={600}>{title}</Text>
          <Text size="sm" c="dimmed">
            {detail}
          </Text>
          <Text size="xs" c={done ? 'teal' : 'dimmed'} data-testid={`${testId}-status`}>
            {status}
          </Text>
        </div>
      </Group>
      {action}
    </Group>
  );
}
