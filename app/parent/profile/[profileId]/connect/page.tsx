'use client';

import { Alert, Button, Container, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft, IconCopy } from '@tabler/icons-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ConnectTabletPage() {
  const params = useParams();
  const profileId = params.profileId as string;

  const [childName, setChildName] = useState('');
  const [playCode, setPlayCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/profiles/${profileId}`);
        if (!res.ok) {
          setError('Could not load profile.');
          return;
        }
        const data: any = await res.json();
        setChildName(data.profile.childName);
        setPlayCode(data.profile.playCode);
      } catch {
        setError('Network error.');
      } finally {
        setLoading(false);
      }
    }
    if (profileId) {
      load();
    }
  }, [profileId]);

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const playUrl = `${origin}/play/${playCode}`;
    navigator.clipboard.writeText(playUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Container size="sm" py="xl" data-testid="connect-tablet-screen">
      <Group mb="xl">
        <Button
          component={Link}
          href={`/parent/profile/${profileId}`}
          variant="subtle"
          color="gray"
          leftSection={<IconArrowLeft size={16} />}
        >
          Back to Customise
        </Button>
      </Group>

      {error && (
        <Alert color="red" mb="lg" radius="md">
          {error}
        </Alert>
      )}

      <Paper p="xl" radius="md" withBorder ta="center">
        <Stack align="center" gap="lg">
          <Title order={1} size="h2">
            Connect {childName ? `${childName}'s` : "Child's"} Tablet
          </Title>
          <Text c="dimmed" size="sm" maw={420}>
            No passwords or logins needed on your child&apos;s device. Use either of these simple
            ways:
          </Text>

          <Paper p="lg" radius="md" withBorder w="100%" maw={360} bg="indigo.0">
            <Text size="xs" fw={700} c="indigo" tt="uppercase" mb="xs">
              Method 1: Enter Family Code
            </Text>
            <Text size="sm" c="dimmed" mb="sm">
              Open Foxwords on the tablet, tap &quot;Play with a family code&quot;, and type:
            </Text>
            <Text size="xl" fw={800} style={{ letterSpacing: 4 }} c="indigo.9">
              {playCode || '······'}
            </Text>
          </Paper>

          <Paper p="lg" radius="md" withBorder w="100%" maw={360}>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
              Method 2: Direct Play URL
            </Text>
            <Text size="sm" c="dimmed" mb="sm">
              Open or bookmark this link on the tablet browser:
            </Text>
            <Button
              variant="light"
              color="indigo"
              leftSection={<IconCopy size={16} />}
              onClick={handleCopyLink}
            >
              {copied ? 'Copied to Clipboard!' : 'Copy Direct Link'}
            </Button>
          </Paper>
        </Stack>
      </Paper>
    </Container>
  );
}
