import { renderHook } from '@testing-library/react';
import { getInputMode, useInputMode } from '../input-mode';

const UA = {
  ipadDesktopMode:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  ipadClassic:
    'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  iphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  androidTablet:
    'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  windows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  linuxKiosk:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  macDesktop:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
};

interface DeviceOptions {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
  coarsePointer?: boolean;
  anyFinePointer?: boolean;
}

function setDevice({
  userAgent,
  platform = '',
  maxTouchPoints = 0,
  coarsePointer = false,
  anyFinePointer = false,
}: DeviceOptions) {
  Object.defineProperty(window.navigator, 'userAgent', { value: userAgent, configurable: true });
  Object.defineProperty(window.navigator, 'platform', { value: platform, configurable: true });
  Object.defineProperty(window.navigator, 'maxTouchPoints', {
    value: maxTouchPoints,
    configurable: true,
  });
  window.matchMedia = jest.fn((query: string) => ({
    matches:
      (query === '(pointer: coarse)' && coarsePointer) ||
      (query === '(any-pointer: fine)' && anyFinePointer),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })) as unknown as typeof window.matchMedia;
}

function clearDevice() {
  for (const prop of ['userAgent', 'platform', 'maxTouchPoints']) {
    delete (window.navigator as unknown as Record<string, unknown>)[prop];
  }
}

describe('getInputMode', () => {
  afterEach(() => {
    clearDevice();
  });

  it('returns native-touch for an iPad in desktop-style (Mac UA) mode', () => {
    setDevice({ userAgent: UA.ipadDesktopMode, platform: 'MacIntel', maxTouchPoints: 5 });
    expect(getInputMode()).toBe('native-touch');
  });

  it('returns native-touch for a classic iPad UA', () => {
    setDevice({
      userAgent: UA.ipadClassic,
      platform: 'iPad',
      maxTouchPoints: 5,
      coarsePointer: true,
    });
    expect(getInputMode()).toBe('native-touch');
  });

  it('returns native-touch for an iPhone', () => {
    setDevice({ userAgent: UA.iphone, platform: 'iPhone', maxTouchPoints: 5, coarsePointer: true });
    expect(getInputMode()).toBe('native-touch');
  });

  it('returns native-touch for an Android tablet', () => {
    setDevice({
      userAgent: UA.androidTablet,
      platform: 'Linux armv8l',
      maxTouchPoints: 5,
      coarsePointer: true,
    });
    expect(getInputMode()).toBe('native-touch');
  });

  it('returns onscreen-keypad for a Windows touch laptop with no mouse', () => {
    setDevice({
      userAgent: UA.windows,
      platform: 'Win32',
      maxTouchPoints: 10,
      coarsePointer: true,
    });
    expect(getInputMode()).toBe('onscreen-keypad');
  });

  it('returns hardware for a Windows touch laptop with a mouse or trackpad', () => {
    setDevice({
      userAgent: UA.windows,
      platform: 'Win32',
      maxTouchPoints: 10,
      coarsePointer: false,
      anyFinePointer: true,
    });
    expect(getInputMode()).toBe('hardware');
  });

  it('returns onscreen-keypad for a Linux touch kiosk with no fine pointer', () => {
    setDevice({
      userAgent: UA.linuxKiosk,
      platform: 'Linux x86_64',
      maxTouchPoints: 10,
      coarsePointer: true,
    });
    expect(getInputMode()).toBe('onscreen-keypad');
  });

  it('returns hardware for a desktop with a mouse and no touch', () => {
    setDevice({ userAgent: UA.windows, platform: 'Win32', anyFinePointer: true });
    expect(getInputMode()).toBe('hardware');
  });

  it('returns hardware for a Mac desktop (no touch points)', () => {
    setDevice({
      userAgent: UA.macDesktop,
      platform: 'MacIntel',
      maxTouchPoints: 0,
      anyFinePointer: true,
    });
    expect(getInputMode()).toBe('hardware');
  });

  it('returns hardware when touch support is not reported at all', () => {
    setDevice({ userAgent: UA.linuxKiosk, platform: 'Linux x86_64' });
    expect(getInputMode()).toBe('hardware');
  });
});

describe('useInputMode', () => {
  afterEach(() => {
    clearDevice();
  });

  it('resolves the device mode after mount', () => {
    setDevice({ userAgent: UA.iphone, platform: 'iPhone', maxTouchPoints: 5 });

    const { result } = renderHook(() => useInputMode());

    expect(result.current).toBe('native-touch');
  });

  it('returns hardware on a desktop', () => {
    setDevice({ userAgent: UA.windows, platform: 'Win32', anyFinePointer: true });

    const { result } = renderHook(() => useInputMode());

    expect(result.current).toBe('hardware');
  });
});
