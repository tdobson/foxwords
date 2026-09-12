'use client';

import { Container, Text, Title } from '@mantine/core';

export default function ParentLoginPage() {
  return (
    <Container size="xs" py="xl" data-testid="parent-login-screen">
      <Title order={1} mb="md" ta="center">
        Parent Portal
      </Title>
      <Text ta="center" c="dimmed">
        Enter your email to receive a sign-in link.
      </Text>
    </Container>
  );
}
