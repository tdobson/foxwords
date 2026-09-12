import { Alert, Button, Container, Paper, Stack, Text, Title } from '@mantine/core';
import { IconAlertTriangle, IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

export default function AuthVerifyErrorPage() {
  return (
    <Container size="xs" py="xl" data-testid="auth-verify-screen">
      <Paper p="xl" radius="md" withBorder ta="center">
        <Stack align="center" gap="md">
          <IconAlertTriangle size={48} color="#fa5252" />
          <Title order={1} size="h2">
            That link has expired or is invalid
          </Title>
          <Text size="sm" c="dimmed">
            For safety, magic sign-in links work only once and expire after 15 minutes.
          </Text>

          <Stack gap="xs" w="100%" mt="md">
            <Button component={Link} href="/parent/login" color="indigo">
              Send me a new link
            </Button>
            <Button
              component={Link}
              href="/"
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={16} />}
            >
              Back to Home
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}
