'use client';

import { Alert, Button, Container, Paper, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft, IconMailCheck, IconRefresh } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const RESEND_COOLDOWN_SECONDS = 30;

export default function CheckEmailPage() {
  const [email, setEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState<{ color: string; text: string } | null>(null);

  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get('email');
    setEmail(fromQuery?.trim() ?? '');
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0 || resending) return;
    setResending(true);
    setNotice(null);
    try {
      const res = await fetch('/api/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.status === 429) {
        setNotice({
          color: 'orange',
          text: 'That is a lot of links in a short time. Please wait a few minutes and try again.',
        });
      } else if (!res.ok) {
        setNotice({
          color: 'red',
          text: 'We could not send a new link right now. Please try again in a moment.',
        });
      } else {
        setNotice({ color: 'teal', text: 'A fresh sign-in link is on its way.' });
      }
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      setNotice({ color: 'red', text: 'Network error. Check your internet connection.' });
    } finally {
      setResending(false);
    }
  };

  const resendDisabled = cooldown > 0 || resending;

  return (
    <Container size="xs" py="xl" data-testid="check-email-screen">
      <Paper p="xl" radius="md" withBorder ta="center">
        <Stack align="center" gap="md">
          <IconMailCheck size={48} color="#4c6ef5" />
          <Title order={1} size="h2">
            Check your email
          </Title>
          {email ? (
            <Text size="md" data-testid="check-email-address">
              We sent a sign-in link to <strong>{email}</strong>.
            </Text>
          ) : (
            <Text size="md">We sent a sign-in link to your email.</Text>
          )}
          <Text size="sm" c="dimmed">
            Open it on this device within 15 minutes. Links work once.
          </Text>
          <Text size="sm" c="dimmed" data-testid="check-spam-hint">
            Not there yet? Check your spam or junk folder. It can take a minute to arrive.
          </Text>

          {notice && (
            <Alert
              color={notice.color}
              radius="md"
              role="status"
              w="100%"
              data-testid="resend-notice"
            >
              {notice.text}
            </Alert>
          )}

          <Stack gap="xs" w="100%" mt="md">
            {email && (
              <Button
                variant="light"
                color="indigo"
                leftSection={<IconRefresh size={16} />}
                onClick={handleResend}
                disabled={resendDisabled}
                loading={resending}
                data-testid="resend-link-btn"
              >
                {cooldown > 0 ? `Resend link in ${cooldown}s` : 'Resend link'}
              </Button>
            )}
            <Button
              component={Link}
              href="/parent/login"
              variant="default"
              data-testid="use-different-email-btn"
            >
              Use a different email
            </Button>
            <Button
              component={Link}
              href="/"
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={16} />}
            >
              Back to home
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}
