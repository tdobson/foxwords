'use client';

import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import {
  IconDeviceTablet,
  IconLogout,
  IconMicrophone,
  IconPencil,
  IconPlayerPlay,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProfileSummary {
  id: string;
  childName: string;
  playCode: string;
  playUrl: string;
  createdAt: number;
  updatedAt: number;
}

export default function ParentDashboardPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addingChild, setAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/profiles');
      if (res.status === 401) {
        router.push('/parent/login');
        return;
      }
      if (!res.ok) {
        setError('Could not load your children. Please try again.');
        return;
      }
      const data: any = await res.json();
      setProfiles(data.profiles || []);
    } catch {
      setError('Network error loading your children.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    const childName = newChildName.trim();
    if (!childName) return;
    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childName }),
      });
      if (res.ok) {
        const data: any = await res.json();
        if (data?.profile?.id) {
          router.push(`/parent/profile/${data.profile.id}/studio`);
          return;
        }
        setNewChildName('');
        setAddingChild(false);
        fetchProfiles();
      } else {
        const data: any = await res.json().catch(() => null);
        setCreateError(data?.error?.message || 'We could not add that name. Please try again.');
      }
    } catch {
      setCreateError('Network error. Check your internet connection and try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProfile = async (profileId: string, name: string) => {
    if (!confirm(`Delete ${name}'s Foxwords space? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/profiles/${profileId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProfiles((prev) => prev.filter((p) => p.id !== profileId));
      } else {
        setError('Could not delete that space. Please try again.');
      }
    } catch {
      setError('Network error deleting that space.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/');
    }
  };

  const nameForm = (
    <form onSubmit={handleCreateChild} data-testid="child-name-form">
      <Stack gap="md">
        <TextInput
          label="What's your child's first name?"
          placeholder="e.g. Maya"
          required
          autoFocus
          autoComplete="off"
          enterKeyHint="go"
          value={newChildName}
          onChange={(e) => setNewChildName(e.currentTarget.value)}
          disabled={creating}
          error={createError}
          data-testid="child-name-input"
        />
        <Group>
          <Button
            type="submit"
            color="indigo"
            loading={creating}
            disabled={!newChildName.trim()}
            data-testid="child-name-submit"
          >
            Continue
          </Button>
          {profiles.length > 0 && (
            <Button
              variant="subtle"
              color="gray"
              onClick={() => {
                setAddingChild(false);
                setCreateError(null);
              }}
            >
              Cancel
            </Button>
          )}
        </Group>
      </Stack>
    </form>
  );

  const isFirstRun = !loading && profiles.length === 0;

  return (
    <Container size="md" py="xl" data-testid="parent-dashboard-screen">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1} size="h2">
            Your Foxwords
          </Title>
          <Text c="dimmed" size="sm">
            Play, record family voices and connect devices for each child.
          </Text>
        </div>
        <Group>
          <Button
            variant="light"
            color="red"
            leftSection={<IconLogout size={16} />}
            onClick={handleLogout}
            data-testid="logout-btn"
          >
            Sign out
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert color="red" mb="lg" radius="md" role="alert">
          {error}
        </Alert>
      )}

      {loading ? (
        <Stack gap="md">
          <Skeleton height={90} radius="md" />
          <Skeleton height={90} radius="md" />
        </Stack>
      ) : isFirstRun ? (
        <Paper p="xl" radius="md" withBorder maw={520} mx="auto">
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Let&apos;s start with one child. You can add more later.
            </Text>
            {nameForm}
          </Stack>
        </Paper>
      ) : (
        <Stack gap="md">
          {addingChild ? (
            <Paper p="lg" radius="md" withBorder maw={520}>
              {nameForm}
            </Paper>
          ) : (
            <Group justify="flex-end">
              <Button
                color="indigo"
                leftSection={<IconPlus size={16} />}
                onClick={() => setAddingChild(true)}
                data-testid="add-child-btn"
              >
                Add another child
              </Button>
            </Group>
          )}

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {profiles.map((p) => (
              <Card key={p.id} p="lg" radius="md" withBorder data-testid="child-card">
                <Group justify="space-between" mb="xs" wrap="nowrap">
                  <Title order={2} size="h3" data-testid="child-card-name">
                    {p.childName}
                  </Title>
                  <Badge color="teal" variant="light">
                    Code {p.playCode}
                  </Badge>
                </Group>

                <Text size="xs" c="dimmed" mb="md">
                  Added {new Date(p.createdAt).toLocaleDateString()}
                </Text>

                <Stack gap="xs">
                  <Button
                    component={Link}
                    href={`/play/${p.playCode}`}
                    color="indigo"
                    leftSection={<IconPlayerPlay size={16} />}
                    data-testid="play-now-btn"
                  >
                    Play now
                  </Button>
                  <Group gap="xs">
                    <Button
                      component={Link}
                      href={`/parent/profile/${p.id}/studio`}
                      variant="light"
                      color="indigo"
                      size="xs"
                      leftSection={<IconMicrophone size={14} />}
                      data-testid="record-voices-btn"
                    >
                      Record voices
                    </Button>
                    <Button
                      component={Link}
                      href={`/parent/profile/${p.id}`}
                      variant="default"
                      size="xs"
                      leftSection={<IconPencil size={14} />}
                      data-testid="customise-btn"
                    >
                      Customise
                    </Button>
                    <Button
                      component={Link}
                      href={`/parent/profile/${p.id}/connect`}
                      variant="default"
                      size="xs"
                      leftSection={<IconDeviceTablet size={14} />}
                      data-testid="connect-device-btn"
                    >
                      Connect a device
                    </Button>
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      aria-label={`Delete ${p.childName}'s space`}
                      onClick={() => handleDeleteProfile(p.id, p.childName)}
                      data-testid="delete-child-btn"
                    >
                      <IconTrash size={14} />
                    </Button>
                  </Group>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      )}
    </Container>
  );
}
