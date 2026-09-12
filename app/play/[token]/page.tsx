'use client';

import {
  Alert,
  Button,
  Card,
  Container,
  Group,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconClock,
  IconHome,
  IconMusic,
  IconNumbers,
  IconQuestionMark,
  IconSparkles,
  IconTypography,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useProfile } from '../../../lib/play/profile-context';

export default function ChildPlayLauncherPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();
  const { setProfile, childName, words } = useProfile();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlayProfile() {
      if (!token) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/play/${encodeURIComponent(token)}`);
        if (!res.ok) {
          setError('This play link is no longer available. Please ask a grown-up for a new code.');
          return;
        }

        const data: any = await res.json();
        setProfile({
          profileId: token,
          childName: data.childName,
          items: data.words
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
          audioOverrides: data.audioOverrides || {},
        });
      } catch {
        setError('Could not load your game space right now.');
      } finally {
        setLoading(false);
      }
    }

    loadPlayProfile();
  }, [token, setProfile]);

  const customCount = words.filter((w) => w.id.startsWith('custom_')).length;

  return (
    <Container size="sm" py="xl" data-testid="child-play-launcher">
      <Group justify="space-between" mb="lg">
        <Button
          component={Link}
          href="/"
          variant="subtle"
          color="gray"
          leftSection={<IconHome size={18} />}
        >
          Home
        </Button>
      </Group>

      {error ? (
        <Alert color="orange" radius="md" title="Oops!" icon={<IconSparkles size={24} />}>
          <Text size="sm" mb="md">
            {error}
          </Text>
          <Button component={Link} href="/join" variant="default" size="xs">
            Enter another code
          </Button>
        </Alert>
      ) : loading ? (
        <Stack gap="md">
          <Skeleton height={60} radius="md" />
          <Skeleton height={200} radius="md" />
        </Stack>
      ) : (
        <Stack align="center" gap="xl">
          <div style={{ textAlign: 'center' }}>
            <Title order={1} size="h1" c="indigo.8">
              Hi {childName}!
            </Title>
            <Text c="dimmed" size="md">
              Choose a game to play
            </Text>
            {customCount > 0 && (
              <Text size="xs" c="teal" fw={600} mt={4}>
                ✨ {customCount} familiar words & voices loaded!
              </Text>
            )}
          </div>

          <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="md" w="100%">
            <Button
              component={Link}
              href="/words"
              size="xl"
              h={88}
              color="indigo"
              variant="filled"
              leftSection={<IconTypography size={32} />}
              style={{ fontSize: 20 }}
            >
              Words
            </Button>

            <Button
              component={Link}
              href="/counting"
              size="xl"
              h={88}
              color="teal"
              variant="filled"
              leftSection={<IconNumbers size={32} />}
              style={{ fontSize: 20 }}
            >
              Counting
            </Button>

            <Button
              component={Link}
              href="/clock"
              size="xl"
              h={88}
              color="orange"
              variant="filled"
              leftSection={<IconClock size={32} />}
              style={{ fontSize: 20 }}
            >
              Clock
            </Button>

            <Button
              component={Link}
              href="/quiz"
              size="xl"
              h={88}
              color="grape"
              variant="filled"
              leftSection={<IconQuestionMark size={32} />}
              style={{ fontSize: 20 }}
            >
              Quiz
            </Button>

            <Button
              component={Link}
              href="/rhyme"
              size="xl"
              h={88}
              color="pink"
              variant="filled"
              leftSection={<IconMusic size={32} />}
              style={{ fontSize: 20 }}
            >
              Rhyme
            </Button>
          </SimpleGrid>

          <Text size="xs" c="dimmed" ta="center">
            Tim&apos;s voice plays automatically for every sound not recorded by your family.
          </Text>
        </Stack>
      )}
    </Container>
  );
}
