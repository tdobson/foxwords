import { useEffect, useState } from 'react';

/**
 * hardware: a physical keyboard is the main input, so show no extra controls.
 * native-touch: Android, iPhone, iPad. The system keyboard pops up when a real input is focused.
 * onscreen-keypad: other touch-only screens (Windows tablets, Linux kiosks) with no system keyboard.
 */
export type InputMode = 'hardware' | 'native-touch' | 'onscreen-keypad';

function matchesMedia(query: string): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
}

export function getInputMode(): InputMode {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'hardware';
  }

  const userAgent = navigator.userAgent ?? '';
  const touchPoints = navigator.maxTouchPoints ?? 0;

  if (/Android|iPhone|iPod|iPad/i.test(userAgent)) {
    return 'native-touch';
  }

  // iPadOS 13+ reports itself as a Mac, but it has a multi-touch screen.
  const isIpadDesktopMode =
    (navigator.platform === 'MacIntel' || /Macintosh/i.test(userAgent)) && touchPoints > 1;
  if (isIpadDesktopMode) {
    return 'native-touch';
  }

  // A mouse or trackpad (any fine pointer) means a desktop-style device, even if it also has a touchscreen.
  const hasTouch = touchPoints > 0 || matchesMedia('(pointer: coarse)');
  if (hasTouch && !matchesMedia('(any-pointer: fine)')) {
    return 'onscreen-keypad';
  }

  return 'hardware';
}

/** Resolves on the client after mount, so server and first client render both use 'hardware'. */
export function useInputMode(): InputMode {
  const [mode, setMode] = useState<InputMode>('hardware');

  useEffect(() => {
    setMode(getInputMode());
  }, []);

  return mode;
}
