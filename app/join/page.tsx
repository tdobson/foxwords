'use client';

import { Container, Text, Title } from '@mantine/core';

export default function JoinPage() {
  return (
    <Container size="xs" py="xl" data-testid="join-screen">
      <Title order={1} mb="md" ta="center">
        Enter Family Code
      </Title>
      <Text ta="center" c="dimmed">
        Type your 4 to 6 character code to start playing.
      </Text>
    </Container>
  );
}
