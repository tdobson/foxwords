'use client';

import {
  Alert,
  Anchor,
  Button,
  Container,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconMail } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ParentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail?.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          setError('Too many sign-in attempts. Please wait 15 minutes before trying again.');
        } else {
          setError('Could not process sign-in right now. Please try again later.');
        }
        return;
      }

      router.push(`/parent/check-email?email=${encodeURIComponent(cleanEmail)}`);
    } catch {
      setError('Network error. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" py="xl" data-testid="parent-login-screen">
      <Paper p="xl" radius="md" withBorder>
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Title order={1} size="h2" ta="center">
              Set up Foxwords
            </Title>
            <Text size="sm" c="dimmed" ta="center">
              Your email is the key to your family space. No password needed, just a link.
            </Text>

            {error && (
              <Alert color="red" radius="md" role="alert">
                {error}
              </Alert>
            )}

            <TextInput
              label="Email address"
              placeholder="parent@example.com"
              type="email"
              inputMode="email"
              autoComplete="email"
              enterKeyHint="go"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              disabled={loading}
              data-testid="email-input"
            />

            <Button
              type="submit"
              color="indigo"
              size="md"
              loading={loading}
              leftSection={<IconMail size={18} />}
              data-testid="submit-login"
            >
              Email me a sign-in link
            </Button>

            <Text size="xs" c="dimmed" ta="center">
              We only use your email to sign you in. Back to{' '}
              <Anchor component={Link} href="/">
                the home page
              </Anchor>
              .
            </Text>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
