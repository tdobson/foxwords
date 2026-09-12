import { Button, Container, Paper, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft, IconMailCheck } from '@tabler/icons-react';
import Link from 'next/link';

export default function CheckEmailPage() {
  return (
    <Container size="xs" py="xl" data-testid="check-email-screen">
      <Paper p="xl" radius="md" withBorder ta="center">
        <Stack align="center" gap="md">
          <IconMailCheck size={48} color="#4c6ef5" />
          <Title order={1} size="h2">
            Check your email
          </Title>
          <Text size="sm" c="dimmed">
            If that address can receive mail, a sign-in link is on its way. It will expire in 15
            minutes.
          </Text>

          <Stack gap="xs" w="100%" mt="md">
            <Button component={Link} href="/parent/login" variant="default">
              Try another email
            </Button>
            <Button
              component={Link}
              href="/"
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={16} />}
            >
              Back to Foxwords
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}
