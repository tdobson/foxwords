export function getClockAudioPath(audioSlug: string): string {
  return `/audio/clock/${audioSlug}.webm`;
}

export function speakClockPhrase(phrase: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(phrase);
  utterance.lang = 'en-GB';
  utterance.rate = 0.9;
  const voices = window.speechSynthesis.getVoices();
  const britishVoice = voices.find(
    (v) => v.lang === 'en-GB' || v.name.includes('UK') || v.name.includes('British')
  );
  if (britishVoice) {
    utterance.voice = britishVoice;
  }
  window.speechSynthesis.speak(utterance);
}

export function playClockAudio(target: { audioSlug: string; spokenPhrase: string }): void {
  const audioPath = getClockAudioPath(target.audioSlug);
  const audio = new Audio(audioPath);
  audio.play().catch(() => {
    // Fallback to Web Speech Synthesis API
    speakClockPhrase(target.spokenPhrase);
  });
}
