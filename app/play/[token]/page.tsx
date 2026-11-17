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
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  isSamePlayCode,
  type PlayPayload,
  profileFromPlayPayload,
} from '../../../lib/play/profile';
import { useProfile } from '../../../lib/play/profile-context';

export default function ChildPlayLauncherPage() {
  const params = useParams();
  const token = params.token as string;
  const { profile, setProfile, childName, words } = useProfile();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Games and back-navigation keep the loaded profile, so don't refetch it.
  const alreadyLoaded = isSamePlayCode(profile, token ?? '');
  const showSkeleton = loading && !alreadyLoaded;

  useEffect(() => {
    if (!token || alreadyLoaded) return;

    let cancelled = false;
    async function loadPlayProfile() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/play/${encodeURIComponent(token)}`);
        if (!res.ok) {
          setError('This play link is no longer available. Please ask a grown-up for a new code.');
          return;
        }

        const data = (await res.json()) as PlayPayload;
        if (!cancelled) {
          setProfile(profileFromPlayPayload(token, data));
        }
      } catch {
        if (!cancelled) {
          setError('Could not load your game space right now.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPlayProfile();
    return () => {
      cancelled = true;
    };
  }, [token, alreadyLoaded, setProfile]);

  const familyWordCount = words.filter((word) => word.id.startsWith('custom_')).length;

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
      ) : showSkeleton ? (
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
            {familyWordCount > 0 && (
              <Text size="xs" c="teal" fw={600} mt={4}>
                ✨ {familyWordCount} words from your family are ready
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
        </Stack>
      )}
    </Container>
  );
}
