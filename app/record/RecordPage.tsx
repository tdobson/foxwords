'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { LETTER_SOUNDS } from '../../constants/letter-sounds';
import { LEARNING_WORDS } from '../../constants/learning-words';
import { getLetterAudioPath, getWordAudioPath } from '../../utils/audio';
import classes from './RecordPage.module.css';

interface RecordingState {
  isRecording: boolean;
  url: string | null;
  isPlaying: boolean;
}

function createInitialState(): RecordingState {
  return { isRecording: false, url: null, isPlaying: false };
}

export default function RecordPage() {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [state, setState] = useState<Record<string, RecordingState>>({});
  const [micError, setMicError] = useState<string | null>(null);
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

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        updateState(key, { url, isRecording: false });
        stopStream(userStream);
        setStream(null);
        setMediaRecorder(null);
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

  const letterItems = LETTER_SOUNDS.map(({ letter, label, word }) => ({
    key: `letter-${letter}`,
    name: `${label} (${word})`,
    file: getLetterAudioPath(letter),
  }));

  const wordItems = LEARNING_WORDS.map((learningWord) => ({
    key: `word-${learningWord.id}`,
    name: learningWord.promptLabel,
    file: getWordAudioPath(learningWord.id),
  }));

  const items = [...letterItems, ...wordItems];

  return (
    <main className={classes.page}>
      <Title order={1} className={classes.title}>
        Record sounds
      </Title>
      <Text className={classes.intro}>
        Record a short sound for each letter and word. Download each file and drop it into the{' '}
        <code>public/audio</code> folder with the shown filename.
      </Text>

      {micError && (
        <Text c="red" className={classes.micError}>
          {micError}
        </Text>
      )}

      <Stack gap="sm">
        {items.map((item) => {
          const itemState = getState(item.key);
          const isRecordingThis = itemState.isRecording;

          return (
            <Paper key={item.key} withBorder className={classes.row} p="sm">
              <Group justify="space-between">
                <div>
                  <Text fw={600}>{item.name}</Text>
                  <Text size="sm" c="dimmed" className={classes.fileName}>
                    {item.file}
                  </Text>
                </div>

                <Group gap="xs">
                  {!isRecordingThis ? (
                    <Button
                      size="xs"
                      onClick={() => startRecording(item.key)}
                      disabled={Boolean(recordingKey)}
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
                    </>
                  )}
                </Group>
              </Group>
            </Paper>
          );
        })}
      </Stack>
    </main>
  );
}
