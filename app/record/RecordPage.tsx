'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { PHONEMES } from '../../constants/phonemes';
import { LETTER_NAMES } from '../../constants/letter-names';
import { LEARNING_WORDS } from '../../constants/learning-words';
import { COUNT_NUMBERS } from '../../constants/count-numbers';
import { getObjectSpokenLabel } from '../../constants/count-plurals';
import {
  getLetterNameAudioPath,
  getNumberAudioPath,
  getPhonemeAudioPath,
  getPluralAudioPath,
  getWordAudioPath,
  playAudio,
  saveAudio,
} from '../../utils/audio';
import classes from './RecordPage.module.css';

interface RecordingItem {
  key: string;
  kind: 'phoneme' | 'letter-name' | 'word' | 'number' | 'plural';
  id: string;
  name: string;
  hint: string;
  file: string;
  path: string;
}

function createItems(): RecordingItem[] {
  const phonemes = PHONEMES.map((phoneme) => ({
    key: `phoneme-${phoneme.slug}`,
    kind: 'phoneme' as const,
    id: phoneme.slug,
    name: phoneme.label,
    hint: phoneme.examples.join(', '),
    file: getPhonemeAudioPath(phoneme.slug),
    path: `public/audio/phonemes/${phoneme.slug}.webm`,
  }));
  const letterNames = LETTER_NAMES.map((letterName) => ({
    key: `letter-name-${letterName.slug}`,
    kind: 'letter-name' as const,
    id: letterName.slug,
    name: letterName.label,
    hint: 'letter name',
    file: getLetterNameAudioPath(letterName.slug),
    path: `public/audio/letter-names/${letterName.slug}.webm`,
  }));
  const words = LEARNING_WORDS.map((learningWord) => ({
    key: `word-${learningWord.id}`,
    kind: 'word' as const,
    id: learningWord.id,
    name: learningWord.promptLabel,
    hint: learningWord.word,
    file: getWordAudioPath(learningWord.id),
    path: `public/audio/words/${learningWord.id}.webm`,
  }));
  const numbers = COUNT_NUMBERS.map((numberItem) => ({
    key: `number-${numberItem.slug}`,
    kind: 'number' as const,
    id: numberItem.slug,
    name: numberItem.name,
    hint: String(numberItem.value),
    file: getNumberAudioPath(numberItem.slug),
    path: `public/audio/numbers/${numberItem.slug}.webm`,
  }));
  const plurals = LEARNING_WORDS.filter((word) => word.id !== 'games').map((learningWord) => ({
    key: `plural-${learningWord.id}`,
    kind: 'plural' as const,
    id: learningWord.id,
    name: getObjectSpokenLabel({ word: learningWord, count: 2 }),
    hint: `${learningWord.word} (plural)`,
    file: getPluralAudioPath(learningWord.id),
    path: `public/audio/plurals/${learningWord.id}.webm`,
  }));
  return [...phonemes, ...letterNames, ...words, ...numbers, ...plurals];
}

export default function RecordPage() {
  const items = useMemo(() => createItems(), []);
  const [index, setIndex] = useState(0);
  const [recordingKey, setRecordingKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [recorderRef, setRecorderRef] = useState<MediaRecorder | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/audio')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to list existing recordings');
        }
        return response.json() as Promise<{
          phonemes: string[];
          letterNames: string[];
          words: string[];
          numbers?: string[];
          plurals?: string[];
        }>;
      })
      .then((existing) => {
        if (cancelled) {
          return;
        }
        const onDisk = new Set([
          ...existing.phonemes,
          ...existing.letterNames,
          ...existing.words,
          ...(existing.numbers ?? []),
          ...(existing.plurals ?? []),
        ]);
        const firstMissingIndex = items.findIndex((item) => !onDisk.has(item.id));
        setIndex(firstMissingIndex === -1 ? items.length : firstMissingIndex);
      })
      .catch(() => {
        // Server unreachable — fall back to starting at the beginning
      });
    return () => {
      cancelled = true;
    };
  }, [items]);

  const item = items[index];
  const isDone = index >= items.length;
  const prevItem = index > 0 ? items[index - 1] : null;

  const itemByKey = useMemo(() => new Map(items.map((item) => [item.key, item])), [items]);

  const startRecording = async (itemToRecord: RecordingItem) => {
    if (recordingKey || saving) {
      return;
    }
    setSaveError(null);
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setRecorderRef(null);
        streamRef.current = null;
        stream.getTracks().forEach((track) => track.stop());
        await finishRecording(itemToRecord, blob);
      };

      recorder.start();
      setRecorderRef(recorder);
      streamRef.current = stream;
      setRecordingKey(itemToRecord.key);
      setRecordingUrl(null);
    } catch {
      setMicError('Could not access the microphone. Allow microphone access and try again.');
    }
  };

  const finishRecording = async (recordedItem: RecordingItem, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setRecordingKey(null);
    setRecordingUrl(url);
    playAudio(url);
    setSaving(true);
    try {
      await saveAudio(recordedItem.kind, recordedItem.id, blob);
      setSaving(false);
      if (index < items.length - 1) {
        setIndex((prev) => prev + 1);
      } else {
        setIndex(items.length);
      }
    } catch {
      setSaving(false);
      setSaveError('Could not save. Check the server is running, then press Retry.');
    }
  };

  const stopRecording = () => {
    if (recorderRef) {
      recorderRef.stop();
    }
  };

  const retrySave = async () => {
    if (!recordingUrl) {
      return;
    }
    const currentItem = itemByKey.get(recordingKey ?? '');
    if (!currentItem) {
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(recordingUrl);
      const blob = await response.blob();
      await saveAudio(currentItem.kind, currentItem.id, blob);
      setSaving(false);
      setIndex((prev) => prev + 1);
    } catch {
      setSaving(false);
      setSaveError('Could not save. Check the server is running, then press Retry.');
    }
  };

  const isRecording = recordingKey !== null;

  const download = (url: string, filename: string) => {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
  };

  const toggleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else if (!isDone) {
      if (saveError && recordingUrl) {
        retrySave();
      } else {
        startRecording(item);
      }
    }
  };

  const spaceKey = (event: KeyboardEvent) => {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    if (event.code === 'Space') {
      event.preventDefault();
      toggleRecord();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', spaceKey);
    return () => window.removeEventListener('keydown', spaceKey);
  });

  const progressLabel = isDone
    ? `${items.length} of ${items.length}`
    : `${index} of ${items.length}`;
  const progressPercent = Math.round((index / items.length) * 100);

  return (
    <main className={classes.page}>
      <Title order={1} className={classes.title}>
        Record sounds
      </Title>

      <Group justify="space-between" align="center" className={classes.progressRow}>
        <Text className={classes.progressLabel} data-testid="progress-label">
          {progressLabel}
        </Text>
        <div
          className={classes.progressBar}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={index}
        >
          <div className={classes.progressFill} style={{ width: `${progressPercent}%` }} />
        </div>
      </Group>

      {micError && (
        <Text c="red" className={classes.micError}>
          {micError}
        </Text>
      )}
      {saveError && (
        <Text c="red" className={classes.micError}>
          {saveError}
        </Text>
      )}

      <div className={classes.guide} data-testid="guide">
        {isDone ? (
          <>
            <Text fw={700} size="lg" className={classes.guideTitle}>
              All sounds recorded!
            </Text>
            <Text className={classes.guideItem}>🎉</Text>
          </>
        ) : (
          <>
            <Text className={classes.guideItem}>
              Say: <span className={classes.promptName}>{item.name}</span>
            </Text>
            <Text size="sm" c="dimmed" className={classes.guideFile}>
              {item.path}
            </Text>
          </>
        )}
      </div>

      <div className={classes.recordArea}>
        <Button
          size="xl"
          className={classes.recordButton}
          data-testid="record-button"
          onClick={toggleRecord}
          disabled={saving}
        >
          {isRecording ? 'Stop' : isDone ? 'Play all' : saveError ? 'Retry' : 'Record'}
        </Button>
        <Text size="xs" c="dimmed" className={classes.spaceHint}>
          (space)
        </Text>
      </div>

      {prevItem && (
        <Group justify="center" gap="md" className={classes.prevRow} data-testid="prev-row">
          <Button
            variant="subtle"
            onClick={() => {
              if (recordingUrl) {
                playAudio(recordingUrl);
              }
            }}
            disabled={!recordingUrl || saving}
          >
            ▶ replay last
          </Button>
          <Button
            variant="subtle"
            onClick={() => {
              if (!isRecording && !saving) {
                setIndex((prev) => prev - 1);
              }
            }}
            disabled={isRecording || saving}
          >
            ⏮ undo
          </Button>
        </Group>
      )}

      <details className={classes.allDetails}>
        <summary className={classes.allSummary}>▸ All recordings ({items.length})</summary>
        <Stack gap="sm">
          {items.map((item, itemIndex) => (
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
                  <Button
                    size="xs"
                    variant="outline"
                    className={classes.rowRecord}
                    onClick={() => {
                      setRecordingUrl(null);
                      startRecording(item);
                    }}
                    disabled={Boolean(recordingKey) || saving}
                  >
                    Record
                  </Button>
                  {itemIndex === index - 1 && recordingUrl && (
                    <>
                      <audio
                        controls
                        preload="none"
                        src={recordingUrl}
                        className={classes.preview}
                      />
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => download(recordingUrl, item.file)}
                      >
                        Download
                      </Button>
                    </>
                  )}
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      </details>
    </main>
  );
}
