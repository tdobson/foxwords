'use client';

import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Modal,
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

  // Add child modal state
  const [createOpened, setCreateOpened] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [creating, setCreating] = useState(false);

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
        setError('Could not load profiles. Please try again.');
        return;
      }
      const data: any = await res.json();
      setProfiles(data.profiles || []);
    } catch {
      setError('Network error loading profiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim()) return;
    setCreating(true);

    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childName: newChildName.trim() }),
      });
      if (res.ok) {
        setNewChildName('');
        setCreateOpened(false);
        fetchProfiles();
      } else {
        const data: any = await res.json();
        alert(data?.error?.message || 'Failed to create child profile');
      }
    } catch {
      alert('Network error creating child profile');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProfile = async (profileId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}'s space? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/profiles/${profileId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProfiles((prev) => prev.filter((p) => p.id !== profileId));
      } else {
        alert('Could not delete profile.');
      }
    } catch {
      alert('Network error deleting profile.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/');
    }
  };

  return (
    <Container size="md" py="xl" data-testid="parent-dashboard-screen">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1} size="h2">
            Foxwords Parent Space
          </Title>
          <Text c="dimmed" size="sm">
            Personalise learning words, family photos, and familiar voices.
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
        <Alert color="red" mb="lg" radius="md">
          {error}
        </Alert>
      )}

      {loading ? (
        <Stack gap="md">
          <Skeleton height={90} radius="md" />
          <Skeleton height={90} radius="md" />
        </Stack>
      ) : profiles.length === 0 ? (
        <Paper p="xl" radius="md" withBorder ta="center">
          <Stack align="center" gap="sm">
            <Title order={2} size="h3">
              No child spaces yet
            </Title>
            <Text c="dimmed" size="sm" maw={400}>
              Make one for your child, then add favourite words, photos, and your own voice
              recordings.
            </Text>
            <Button
              mt="md"
              color="indigo"
              size="md"
              leftSection={<IconPlus size={18} />}
              onClick={() => setCreateOpened(true)}
              data-testid="add-first-child-btn"
            >
              Add a child
            </Button>
          </Stack>
        </Paper>
      ) : (
        <Stack gap="md">
          <Group justify="flex-end">
            <Button
              color="indigo"
              leftSection={<IconPlus size={16} />}
              onClick={() => setCreateOpened(true)}
              data-testid="add-child-btn"
            >
              Add another child
            </Button>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {profiles.map((p) => (
              <Card key={p.id} p="lg" radius="md" withBorder>
                <Group justify="space-between" mb="xs">
                  <Title order={3} size="h4">
                    {p.childName}
                  </Title>
                  <Badge color="teal" variant="light">
                    Code: {p.playCode}
                  </Badge>
                </Group>

                <Text size="xs" c="dimmed" mb="md">
                  Created {new Date(p.createdAt).toLocaleDateString()}
                </Text>

                <Group justify="space-between" mt="auto">
                  <Button
                    component={Link}
                    href={`/play/${p.playCode}`}
                    variant="light"
                    color="indigo"
                    size="xs"
                    leftSection={<IconPlayerPlay size={14} />}
                  >
                    Open Game
                  </Button>

                  <Group gap="xs">
                    <Button
                      component={Link}
                      href={`/parent/profile/${p.id}`}
                      variant="default"
                      size="xs"
                      leftSection={<IconPencil size={14} />}
                    >
                      Customise
                    </Button>
                    <Button
                      component={Link}
                      href={`/parent/profile/${p.id}/connect`}
                      variant="default"
                      size="xs"
                      leftSection={<IconDeviceTablet size={14} />}
                    >
                      Connect
                    </Button>
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={() => handleDeleteProfile(p.id, p.childName)}
                    >
                      <IconTrash size={14} />
                    </Button>
                  </Group>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      )}

      <Modal
        opened={createOpened}
        onClose={() => setCreateOpened(false)}
        title="Create Child Learning Space"
        centered
      >
        <form onSubmit={handleCreateChild}>
          <Stack gap="md">
            <TextInput
              label="Child's Name"
              placeholder="e.g. Maya or Leo"
              required
              value={newChildName}
              onChange={(e) => setNewChildName(e.currentTarget.value)}
              disabled={creating}
              data-testid="new-child-name-input"
            />
            <Button
              type="submit"
              color="indigo"
              loading={creating}
              disabled={!newChildName.trim()}
              data-testid="confirm-create-child"
            >
              Create Child Space
            </Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
