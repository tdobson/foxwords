'use client';

import { Alert, Button, Container, Group, Image, Paper, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft, IconCheck, IconCopy, IconPlayerPlay } from '@tabler/icons-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

export default function ConnectDevicePage() {
  const params = useParams();
  const profileId = params.profileId as string;

  const [childName, setChildName] = useState('');
  const [playCode, setPlayCode] = useState('');
  const [origin, setOrigin] = useState('');
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/profiles/${profileId}`);
        if (!res.ok) {
          setError('Could not load this Foxwords space.');
          return;
        }
        const data: any = await res.json();
        if (cancelled) return;
        setChildName(data.profile.childName);
        setPlayCode(data.profile.playCode);
      } catch {
        setError('Network error loading this Foxwords space.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const playPath = playCode ? `/play/${playCode}` : '';
  const playUrl = origin && playPath ? `${origin}${playPath}` : playPath;

  useEffect(() => {
    if (!origin || !playCode) return;
    let cancelled = false;
    QRCode.toString(`${origin}/play/${playCode}`, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
    })
      .then((svg) => {
        if (!cancelled) {
          setQrSrc(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
        }
      })
      .catch(() => {
        if (!cancelled) setQrSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [origin, playCode]);

  const handleCopyLink = async () => {
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(playUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFailed(true);
    }
  };

  const codeSpaced = playCode ? playCode.split('').join(' ') : '';

  return (
    <Container size="sm" py="xl" data-testid="connect-device-screen">
      <Group mb="xl">
        <Button
          component={Link}
          href={`/parent/profile/${profileId}`}
          variant="subtle"
          color="gray"
          leftSection={<IconArrowLeft size={16} />}
          data-testid="connect-back-btn"
        >
          Back to {childName || 'this child'}&apos;s Foxwords
        </Button>
      </Group>

      {error && (
        <Alert color="red" mb="lg" radius="md" role="alert">
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <Stack gap="lg">
          <div>
            <Title order={1} size="h2">
              Play {childName}&apos;s Foxwords on a tablet
            </Title>
            <Text c="dimmed" size="sm" mt={4}>
              No login is needed on the device. Use the code, the link or the QR code.
            </Text>
          </div>

          <Paper p="xl" radius="md" withBorder ta="center" data-testid="connect-code-panel">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={4}>
              Family code
            </Text>
            <Text
              fw={800}
              data-testid="connect-family-code"
              aria-label={`Family code ${playCode}`}
              style={{ fontSize: '3.5rem', letterSpacing: '0.2em', lineHeight: 1.1 }}
            >
              {codeSpaced || '······'}
            </Text>
            <Text size="sm" c="dimmed" mt="xs">
              Tap &quot;I have a family code&quot; on the home page and type it in.
            </Text>
          </Paper>

          <Paper p="lg" radius="md" withBorder>
            <Group align="flex-start" justify="space-between" wrap="wrap" gap="lg">
              <Stack gap="sm" style={{ flex: 1, minWidth: 220 }}>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Play link
                </Text>
                <Text
                  component="a"
                  href={playPath}
                  data-testid="connect-play-link"
                  style={{ wordBreak: 'break-all' }}
                  c="indigo"
                  fw={600}
                >
                  {playUrl}
                </Text>
                <Group gap="xs">
                  <Button
                    variant="light"
                    color="indigo"
                    leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                    onClick={handleCopyLink}
                    disabled={!playCode}
                    data-testid="copy-play-link-btn"
                  >
                    {copied ? 'Copied' : 'Copy link'}
                  </Button>
                  <Button
                    component={Link}
                    href={playPath}
                    color="teal"
                    leftSection={<IconPlayerPlay size={16} />}
                    disabled={!playCode}
                    data-testid="open-on-device-btn"
                  >
                    Open on this device
                  </Button>
                </Group>
                {copyFailed && (
                  <Text size="sm" c="red" role="status">
                    Could not copy. Select the link above and copy it by hand.
                  </Text>
                )}
              </Stack>

              <Stack gap={4} align="center">
                {qrSrc ? (
                  <Image
                    src={qrSrc}
                    alt={`QR code for ${childName}'s play link`}
                    w={180}
                    h={180}
                    data-testid="connect-qr"
                  />
                ) : (
                  <Text size="sm" c="dimmed" data-testid="connect-qr-placeholder">
                    QR code loading
                  </Text>
                )}
                <Text size="xs" c="dimmed">
                  Point a tablet camera at it
                </Text>
              </Stack>
            </Group>
          </Paper>

          <Paper p="lg" radius="md" withBorder data-testid="connect-steps">
            <Title order={2} size="h4" mb="sm">
              On a tablet or phone
            </Title>
            <ol style={{ paddingLeft: 20, margin: 0, lineHeight: 1.7 }}>
              <li>Scan the QR code, or open the play link above in the browser.</li>
              <li>
                Or go to <strong data-testid="connect-join-url">{origin}/join</strong> and type the
                code <strong>{playCode}</strong>.
              </li>
              <li>Add it to the home screen so it opens like an app.</li>
            </ol>
          </Paper>
        </Stack>
      )}
    </Container>
  );
}
