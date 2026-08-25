'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActionIcon, Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { PHONEMES } from '../../constants/phonemes';
import { LEARNING_WORDS } from '../../constants/learning-words';
import { getPhonemeAudioPath, getWordAudioPath, saveAudio } from '../../utils/audio';
import classes from './RecordPage.module.css';

interface SaveState {
  saving: boolean;
  error: string | null;
}

function createInitialState(): RecordingState {
  return { isRecording: false, url: null, isPlaying: false };
}

interface RecordingState {
  isRecording: boolean;
  url: string | null;
  isPlaying: boolean;
}

export default function RecordPage() {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [state, setState] = useState<Record<string, RecordingState>>({});
  const [micError, setMicError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ saving: false, error: null });
  const [queueIndex, setQueueIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const chunksRef = useRef<Blob[]>([]);

  const recordingKey = Object.entries(state).find(([, item]) => item.isRecording)?.[0];

  const getState = (key: string): RecordingState => state[key] ?? createInitialState();

  const updateState = (key: string, patch: Partial<RecordingState>) => {
    setState((prev) => ({
      ...prev,
      [key]: { ...createInitialState(), ...prev[key], ...patch },
    }));
  };

  const stopStream = (streamToStop: MediaStream) => {
    streamToStop.getTracks().forEach((track) => track.stop());
  };

  const startRecording = async (key: string) => {
    if (recordingKey) {
      return;
    }

    try {
      const userStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(userStream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        updateState(key, { url, isRecording: false });
        stopStream(userStream);
        setStream(null);
        setMediaRecorder(null);
        await saveBlob(key, blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setStream(userStream);
      updateState(key, { isRecording: true });
      setMicError(null);
    } catch {
      setMicError('Could not access the microphone. Allow microphone access and try again.');
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
  };

  const saveBlob = async (key: string, blob: Blob) => {
    const item = itemByKey.get(key);
    if (!item) {
      return;
    }
    setSaveState({ saving: true, error: null });
    try {
      await saveAudio(item.kind, item.id, blob);
      setSaveState({ saving: false, error: null });
    } catch {
      setSaveState({
        saving: false,
        error: 'Could not save. Check the server is running and try again.',
      });
    }
  };

  const download = (url: string, filename: string) => {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stopStream(stream);
      }
    };
  }, [stream]);

  const phonemeItems = useMemo(
    () =>
      PHONEMES.map((phoneme) => ({
        key: `phoneme-${phoneme.slug}`,
        kind: 'phoneme' as const,
        id: phoneme.slug,
        name: phoneme.label,
        hint: phoneme.examples.join(', '),
        file: getPhonemeAudioPath(phoneme.slug),
        path: `public/audio/phonemes/${phoneme.slug}.webm`,
      })),
    []
  );

  const wordItems = useMemo(
    () =>
      LEARNING_WORDS.map((learningWord) => ({
        key: `word-${learningWord.id}`,
        kind: 'word' as const,
        id: learningWord.id,
        name: learningWord.promptLabel,
        hint: learningWord.word,
        file: getWordAudioPath(learningWord.id),
        path: `public/audio/words/${learningWord.id}.webm`,
      })),
    []
  );

  const allItems = useMemo(() => [...phonemeItems, ...wordItems], [phonemeItems, wordItems]);
  const itemByKey = useMemo(() => new Map(allItems.map((item) => [item.key, item])), [allItems]);

  const pendingItems = useMemo(
    () => allItems.filter((item) => !state[item.key]?.url),
    [allItems, state]
  );

  const doneItems = useMemo(
    () => allItems.filter((item) => Boolean(state[item.key]?.url)),
    [allItems, state]
  );

  const guidedItem = pendingItems[queueIndex];

  const hasRecording = (key: string): boolean => Boolean(state[key]?.url);

  const recordNext = () => {
    const item = guidedItem;
    if (!item) {
      return;
    }
    if (hasRecording(item.key)) {
      const nextItem = pendingItems[queueIndex + 1];
      if (nextItem) {
        setHistory((prev) => [...prev, queueIndex]);
        setQueueIndex((prev) => prev + 1);
      }
    } else {
      startRecording(item.key);
    }
  };

  const undo = () => {
    if (history.length === 0) {
      return;
    }
    const prevIndex = history[history.length - 1];
    const prevItem = pendingItems[prevIndex];
    if (prevItem && hasRecording(prevItem.key)) {
      setHistory((prev) => prev.slice(0, -1));
      setQueueIndex(prevIndex);
    }
  };

  const rerecord = (key: string) => {
    startRecording(key);
  };

  const toggleRecord = (key: string) => {
    if (recordingKey) {
      stopRecording();
    } else {
      startRecording(key);
    }
  };

  const spaceKey = (event: KeyboardEvent) => {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    if (event.code === 'Space') {
      event.preventDefault();
      toggleRecord(guidedItem?.key ?? '');
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', spaceKey);
    return () => window.removeEventListener('keydown', spaceKey);
  });

  return (
    <main className={classes.page}>
      <Title order={1} className={classes.title}>
        Record sounds
      </Title>
      <Text className={classes.intro}>
        Record each sound once. Press <kbd>Space</kbd> (or tap the button) to start, say the sound,
        then press <kbd>Space</kbd> again to stop and save. Each recording drops straight into the
        right folder — no downloading or moving files. Use <b>Undo</b> to go back and re-record.
      </Text>

      {micError && (
        <Text c="red" className={classes.micError}>
          {micError}
        </Text>
      )}
      {saveState.error && (
        <Text c="red" className={classes.micError}>
          {saveState.error}
        </Text>
      )}

      <Paper className={classes.guide} p="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text fw={700} size="lg" className={classes.guideTitle}>
              Guided recording
            </Text>
            <Text className={classes.guideItem} data-testid="guide-item">
              {guidedItem
                ? `${pendingItems.indexOf(guidedItem) + 1} of ${pendingItems.length}: ${guidedItem.name} (${guidedItem.hint})`
                : 'All sounds recorded!'}
            </Text>
            <Text size="sm" c="dimmed" className={classes.guideFile}>
              {guidedItem?.path}
            </Text>
          </div>

          <Group gap="xs">
            {guidedItem && (
              <>
                {recordingKey === guidedItem.key ? (
                  <Button color="red" onClick={stopRecording}>
                    Stop
                  </Button>
                ) : (
                  <Button
                    onClick={() => recordNext()}
                    disabled={saveState.saving || Boolean(recordingKey)}
                  >
                    {hasRecording(guidedItem.key) ? 'Next' : 'Record'}
                  </Button>
                )}
                {hasRecording(guidedItem.key) && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => rerecord(guidedItem.key)}
                      disabled={saveState.saving || Boolean(recordingKey)}
                    >
                      Re-record
                    </Button>
                    <Button
                      variant="subtle"
                      onClick={undo}
                      disabled={history.length === 0 || Boolean(recordingKey) || saveState.saving}
                    >
                      Undo
                    </Button>
                  </>
                )}
              </>
            )}
          </Group>
        </Group>
      </Paper>

      <Stack gap="sm">
        {pendingItems.map((item) => {
          const itemState = getState(item.key);
          const isRecordingThis = itemState.isRecording;

          return (
            <Paper key={item.key} withBorder className={classes.row} p="sm">
              <Group justify="space-between">
                <div>
                  <Text fw={600}>{item.name}</Text>
                  <Text size="sm" c="dimmed" className={classes.hint}>
                    {item.hint}
                  </Text>
                  <Text size="xs" c="dimmed" className={classes.fileName}>
                    {item.file}
                  </Text>
                </div>

                <Group gap="xs">
                  {!isRecordingThis ? (
                    <Button
                      size="xs"
                      onClick={() => startRecording(item.key)}
                      disabled={Boolean(recordingKey) || saveState.saving}
                    >
                      Record
                    </Button>
                  ) : (
                    <Button size="xs" color="red" onClick={stopRecording}>
                      Stop
                    </Button>
                  )}

                  {itemState.url && (
                    <>
                      <audio
                        controls
                        preload="none"
                        src={itemState.url}
                        className={classes.preview}
                      />
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => download(itemState.url ?? '', item.file)}
                      >
                        Download
                      </Button>
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        onClick={() => rerecord(item.key)}
                        disabled={Boolean(recordingKey) || saveState.saving}
                      >
                        Re-record
                      </Button>
                    </>
                  )}
                </Group>
              </Group>
            </Paper>
          );
        })}

        {doneItems.length > 0 && (
          <>
            <Text fw={700} mt="lg" className={classes.doneHeading}>
              Recorded ({doneItems.length})
            </Text>
            <Stack gap="sm">
              {doneItems.map((item) => {
                const itemState = getState(item.key);
                return (
                  <Paper key={item.key} withBorder className={classes.row} p="sm">
                    <Group justify="space-between">
                      <div>
                        <Text fw={600}>{item.name}</Text>
                        <Text size="sm" c="dimmed" className={classes.hint}>
                          {item.hint}
                        </Text>
                      </div>
                      <Group gap="xs">
                        <audio
                          controls
                          preload="none"
                          src={itemState.url ?? ''}
                          className={classes.preview}
                        />
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          onClick={() => rerecord(item.key)}
                          aria-label={`Re-record ${item.name}`}
                          disabled={Boolean(recordingKey) || saveState.saving}
                        >
                          ↩
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
          </>
        )}
      </Stack>
    </main>
  );
}
