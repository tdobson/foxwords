'use client';

import {
  Alert,
  Button,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconArrowLeft, IconBackspace, IconSparkles } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useProfile } from '../../lib/play/profile-context';

const KEYPAD_LETTERS = [
  ['A', 'B', 'C', 'D', 'E', 'F'],
  ['G', 'H', 'J', 'K', 'L', 'M'],
  ['N', 'P', 'Q', 'R', 'S', 'T'],
  ['U', 'V', 'W', 'X', 'Y', 'Z'],
  ['2', '3', '4', '5', '6', '7'],
  ['8', '9'],
];

export default function JoinPage() {
  const router = useRouter();
  const { setProfile } = useProfile();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChar = (char: string) => {
    if (code.length < 8) {
      setCode((prev) => prev + char);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setCode((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setCode('');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/play/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data: any = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setError('Too many tries. Wait a little and try again.');
        } else {
          setError('Code not found. Check the letters and try again.');
        }
        return;
      }

      // Fetch public play payload for child profile
      const playRes = await fetch(`/api/play/${encodeURIComponent(data.play.playCode)}`);
      if (playRes.ok) {
        const playData: any = await playRes.json();
        setProfile({
          profileId: data.play.profileId,
          childName: playData.childName,
          items: playData.words
            .filter((w: any) => w.id.startsWith('custom_'))
            .map((w: any) => ({
              id: w.id.replace(/^custom_/, ''),
              word: w.word,
              promptLabel: w.promptLabel,
              category: 'custom',
              promptEmoji: w.promptImage,
              photoUrl: w.photoUrl,
              audioUrl: w.audioUrl,
              ipa: w.ipa,
            })),
          audioOverrides: playData.audioOverrides || {},
        });
      }

      router.push(`/play/${encodeURIComponent(data.play.playCode)}`);
    } catch {
      setError('Unable to connect right now. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="sm" py="xl" data-testid="join-screen">
      <Group justify="space-between" mb="lg">
        <Button
          component={Link}
          href="/"
          variant="subtle"
          color="gray"
          leftSection={<IconArrowLeft size={18} />}
        >
          Back
        </Button>
      </Group>

      <Stack align="center" gap="md">
        <Title order={1} ta="center" size="h2">
          Join your Foxwords game
        </Title>
        <Text c="dimmed" ta="center">
          Ask a grown-up for your family play code:
        </Text>

        <Paper
          p="md"
          radius="md"
          withBorder
          w="100%"
          maw={360}
          ta="center"
          style={{ minHeight: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text size="xl" fw={700} style={{ letterSpacing: 4 }}>
            {code || '······'}
          </Text>
        </Paper>

        {error && (
          <Alert color="red" w="100%" maw={400} ta="center" radius="md">
            {error}
          </Alert>
        )}

        <Stack gap="xs" w="100%" maw={400}>
          {KEYPAD_LETTERS.map((row) => (
            <Group key={row.join('')} justify="center" gap="xs" grow>
              {row.map((char) => (
                <Button
                  key={char}
                  size="lg"
                  variant="light"
                  color="indigo"
                  onClick={() => handleChar(char)}
                  disabled={loading}
                  style={{ minWidth: 44, padding: 0 }}
                >
                  {char}
                </Button>
              ))}
            </Group>
          ))}

          <Group justify="center" gap="xs" grow>
            <Button
              size="lg"
              variant="default"
              onClick={handleBackspace}
              disabled={loading || code.length === 0}
              leftSection={<IconBackspace size={20} />}
            >
              Delete
            </Button>
            <Button
              size="lg"
              variant="default"
              onClick={handleClear}
              disabled={loading || code.length === 0}
            >
              Clear
            </Button>
          </Group>

          <Button
            size="xl"
            color="teal"
            mt="sm"
            onClick={handleSubmit}
            loading={loading}
            disabled={code.length < 3}
            leftSection={<IconSparkles size={22} />}
          >
            LET&apos;S PLAY!
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
