'use client';

import { Button, Container, Paper, Stack, Text, Title } from '@mantine/core';
import { IconAlertTriangle, IconArrowLeft, IconLogin } from '@tabler/icons-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function ConfirmSignIn({ token }: { token: string }) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <Stack align="center" gap="md">
      <IconLogin size={48} color="#4c6ef5" aria-hidden />
      <Title order={1} size="h2">
        Sign in to Foxwords
      </Title>
      <Text size="sm" c="dimmed">
        Tap the button to finish signing in on this device.
      </Text>
      <form
        method="post"
        action="/api/auth/verify"
        onSubmit={() => setSubmitting(true)}
        style={{ width: '100%' }}
      >
        <input type="hidden" name="token" value={token} />
        <Button
          type="submit"
          fullWidth
          size="lg"
          color="indigo"
          loading={submitting}
          data-testid="confirm-sign-in-btn"
        >
          Sign in
        </Button>
      </form>
    </Stack>
  );
}

function InvalidLink() {
  return (
    <Stack align="center" gap="md">
      <IconAlertTriangle size={48} color="#fa5252" aria-hidden />
      <Title order={1} size="h2">
        That link has expired or is invalid
      </Title>
      <Text size="sm" c="dimmed">
        For safety, sign-in links work only once and expire after 15 minutes.
      </Text>
      <Stack gap="xs" w="100%" mt="md">
        <Button
          component={Link}
          href="/parent/login"
          color="indigo"
          data-testid="send-new-link-btn"
        >
          Send me a new link
        </Button>
        <Button
          component={Link}
          href="/"
          variant="subtle"
          data-testid="verify-home-btn"
          color="gray"
          leftSection={<IconArrowLeft size={16} />}
        >
          Back to home
        </Button>
      </Stack>
    </Stack>
  );
}

function VerifyContent() {
  const token = useSearchParams().get('token');
  return token ? <ConfirmSignIn token={token} /> : <InvalidLink />;
}

export default function AuthVerifyPage() {
  return (
    <Container size="xs" py="xl" data-testid="auth-verify-screen">
      <Paper p="xl" radius="md" withBorder ta="center">
        <Suspense fallback={null}>
          <VerifyContent />
        </Suspense>
      </Paper>
    </Container>
  );
}
