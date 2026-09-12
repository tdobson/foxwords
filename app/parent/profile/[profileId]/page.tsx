'use client';

import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  FileInput,
  Group,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconDeviceTablet,
  IconMicrophone,
  IconMicrophoneOff,
  IconPhoto,
  IconPlus,
  IconTrash,
  IconVolume,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

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
  const [categoryInput, setCategoryInput] = useState<string>('vip');
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
        setError('Could not load profile.');
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
      setError('Network error loading profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profileId) {
      fetchProfileData();
    }
  }, [profileId]);

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
      alert('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleCreateWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordInput.trim() || !labelInput.trim()) return;
    setSubmittingWord(true);

    try {
      let photoAssetId: string | null = null;
      let audioAssetId: string | null = null;

      // 1. Upload photo if selected
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

      // 2. Upload recorded audio if present
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

      // 3. Create Word Item
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
        setWordInput('');
        setLabelInput('');
        setPhotoFile(null);
        setRecordedAudioBlob(null);
        setAddWordOpened(false);
        fetchProfileData();
      } else {
        const data: any = await res.json();
        alert(data?.error?.message || 'Failed to add item');
      }
    } catch {
      alert('Error saving custom word');
    } finally {
      setSubmittingWord(false);
    }
  };

  const handleDeleteWord = async (wordId: string) => {
    if (!confirm('Remove this custom word?')) return;
    try {
      const res = await fetch(`/api/profiles/${profileId}/items/${wordId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setWords((prev) => prev.filter((w) => w.id !== wordId));
      }
    } catch {
      alert('Error deleting word');
    }
  };

  const handleClearOverride = async (clipKey: string) => {
    try {
      const res = await fetch(`/api/profiles/${profileId}/audio-overrides`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clipKey }),
      });
      if (res.ok) {
        setOverrides((prev) => prev.filter((o) => o.clip_key !== clipKey));
      }
    } catch {
      alert('Could not clear voice override.');
    }
  };

  return (
    <Container size="md" py="xl" data-testid="profile-customiser-screen">
      <Group justify="space-between" mb="xl">
        <Button
          component={Link}
          href="/parent"
          variant="subtle"
          color="gray"
          leftSection={<IconArrowLeft size={16} />}
        >
          Parent Dashboard
        </Button>
        <Button
          component={Link}
          href={`/parent/profile/${profileId}/connect`}
          variant="light"
          color="teal"
          leftSection={<IconDeviceTablet size={16} />}
        >
          Connect Tablet
        </Button>
      </Group>

      {error && (
        <Alert color="red" mb="lg" radius="md">
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
          <Paper p="lg" radius="md" withBorder>
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={2} size="h3">
                  {childName}&apos;s Foxwords
                </Title>
                <Text size="sm" c="dimmed">
                  Family Play Code: <Badge color="indigo">{playCode}</Badge>
                </Text>
              </div>
            </Group>
          </Paper>

          <div>
            <Group justify="space-between" mb="md">
              <Title order={3} size="h4">
                Family, People & Pet Words
              </Title>
              <Button
                color="indigo"
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={() => setAddWordOpened(true)}
              >
                Add Word or VIP
              </Button>
            </Group>

            {words.length === 0 ? (
              <Paper p="md" radius="md" withBorder ta="center">
                <Text c="dimmed" size="sm">
                  No custom family words added yet. Add Mum, Dad, Grandad, pets, or favourite toys!
                </Text>
              </Paper>
            ) : (
              <Table withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Word</Table.Th>
                    <Table.Th>Label</Table.Th>
                    <Table.Th>Category</Table.Th>
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
                          {w.category}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {w.photo_asset_id ? (
                          <Badge color="green" size="xs">
                            Custom Photo
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
                            Family Voice
                          </Badge>
                        ) : (
                          <Text size="xs" c="dimmed">
                            Tim Default
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Button
                          variant="subtle"
                          color="red"
                          size="xs"
                          onClick={() => handleDeleteWord(w.id)}
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
            <Title order={3} size="h4" mb="xs">
              Custom Voice Overrides
            </Title>
            <Text size="xs" c="dimmed" mb="md">
              Whenever a sound hasn&apos;t been recorded with a family voice, Tim Dobson&apos;s
              friendly voice plays automatically.
            </Text>

            <Paper p="md" radius="md" withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm" fw={600}>
                    Praise clip: &quot;Great job!&quot;
                  </Text>
                  {overrides.some((o) => o.clip_key === 'praise_great_job') ? (
                    <Group gap="xs">
                      <Badge color="teal">Family Voice Active</Badge>
                      <Button
                        size="xs"
                        variant="subtle"
                        color="red"
                        onClick={() => handleClearOverride('praise_great_job')}
                      >
                        Reset to Tim
                      </Button>
                    </Group>
                  ) : (
                    <Badge color="gray">Tim Default</Badge>
                  )}
                </Group>
              </Stack>
            </Paper>
          </div>
        </Stack>
      )}

      {/* Add Custom Word Modal */}
      <Modal
        opened={addWordOpened}
        onClose={() => setAddWordOpened(false)}
        title="Add Word, Person or Pet"
        centered
      >
        <form onSubmit={handleCreateWord}>
          <Stack gap="md">
            <TextInput
              label="Word to spell (uppercase)"
              placeholder="e.g. MUM, DAD, ROVER"
              required
              value={wordInput}
              onChange={(e) => setWordInput(e.currentTarget.value.toUpperCase())}
            />
            <TextInput
              label="Friendly display label"
              placeholder="e.g. Mum, Rover"
              required
              value={labelInput}
              onChange={(e) => setLabelInput(e.currentTarget.value)}
            />
            <Select
              label="Category"
              data={[
                { value: 'vip', label: 'VIP (Mum, Dad, Grandad)' },
                { value: 'family', label: 'Family Member' },
                { value: 'pet', label: 'Family Pet' },
                { value: 'toy', label: 'Favourite Toy' },
                { value: 'custom', label: 'Custom Object' },
              ]}
              value={categoryInput}
              onChange={(val) => setCategoryInput(val || 'custom')}
            />
            <FileInput
              label="Upload photo (optional)"
              placeholder="Pick JPEG, PNG, or WebP"
              accept="image/jpeg,image/png,image/webp"
              leftSection={<IconPhoto size={16} />}
              value={photoFile}
              onChange={setPhotoFile}
            />

            <div>
              <Text size="sm" fw={500} mb="xs">
                Record family voice (optional)
              </Text>
              <Group>
                {!isRecording ? (
                  <Button
                    variant="light"
                    color="indigo"
                    size="sm"
                    onClick={startRecording}
                    leftSection={<IconMicrophone size={16} />}
                  >
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    variant="filled"
                    color="red"
                    size="sm"
                    onClick={stopRecording}
                    leftSection={<IconMicrophoneOff size={16} />}
                  >
                    Stop Recording
                  </Button>
                )}

                {recordedAudioBlob && (
                  <Badge color="green" leftSection={<IconVolume size={12} />}>
                    Voice recorded!
                  </Badge>
                )}
              </Group>
            </div>

            <Button
              type="submit"
              color="indigo"
              loading={submittingWord}
              disabled={!wordInput.trim() || !labelInput.trim()}
            >
              Add to {childName}&apos;s Foxwords
            </Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
