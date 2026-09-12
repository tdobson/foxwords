require('@testing-library/jest-dom');
const { TextEncoder, TextDecoder } = require('node:util');
const { webcrypto } = require('node:crypto');
const stream = require('node:stream/web');

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}
if (typeof global.TextEncoderStream === 'undefined') {
  global.TextEncoderStream = stream.TextEncoderStream;
}
if (typeof global.TextDecoderStream === 'undefined') {
  global.TextDecoderStream = stream.TextDecoderStream;
}
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = stream.ReadableStream;
}
if (typeof global.WritableStream === 'undefined') {
  global.WritableStream = stream.WritableStream;
}
if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = stream.TransformStream;
}
if (typeof window !== 'undefined') {
  window.TextEncoder = TextEncoder;
  window.TextDecoder = TextDecoder;
  window.TextEncoderStream = stream.TextEncoderStream;
  window.TextDecoderStream = stream.TextDecoderStream;
  window.ReadableStream = stream.ReadableStream;
  window.WritableStream = stream.WritableStream;
  window.TransformStream = stream.TransformStream;
}

if (typeof global.structuredClone === 'undefined' && typeof v8 !== 'undefined') {
  global.structuredClone = (val) => v8.deserialize(v8.serialize(val));
} else if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}
if (typeof window !== 'undefined' && typeof window.structuredClone === 'undefined') {
  window.structuredClone = global.structuredClone;
}

const { Response, Request, Headers } = require('next/dist/compiled/@edge-runtime/primitives');
global.Response = Response;
global.Request = Request;
global.Headers = Headers;

if (typeof window !== 'undefined') {
  window.Response = Response;
  window.Request = Request;
  window.Headers = Headers;
  Object.defineProperty(window, 'crypto', {
    value: webcrypto,
    writable: true,
  });
  const { getComputedStyle } = window;
  window.getComputedStyle = (elt) => getComputedStyle(elt);
  window.HTMLElement.prototype.scrollIntoView = () => {};

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  window.ResizeObserver = ResizeObserver;

  if (typeof HTMLMediaElement !== 'undefined') {
    HTMLMediaElement.prototype.play = jest.fn().mockReturnValue(Promise.resolve());
    HTMLMediaElement.prototype.pause = jest.fn();
  }
}
Object.defineProperty(global, 'crypto', {
  value: webcrypto,
  writable: true,
});
