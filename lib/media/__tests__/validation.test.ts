import { validateUpload } from '../validation';

describe('Media Upload Validation', () => {
  const makeFile = (bytes: number[], contentType: string, size = bytes.length) => {
    const uint8 = new Uint8Array(size);
    uint8.set(bytes);
    return {
      contentType,
      buffer: uint8.buffer,
      byteSize: uint8.byteLength,
    };
  };

  it('accepts valid JPEG photo under 5 MiB', () => {
    // JPEG header: FF D8 FF
    const file = makeFile([0xff, 0xd8, 0xff, 0xe0], 'image/jpeg', 1024);
    const result = validateUpload(file.contentType, file.buffer);
    expect(result.kind).toBe('photo');
    expect(result.contentType).toBe('image/jpeg');
    expect(result.extension).toBe('jpg');
    expect(result.byteSize).toBe(1024);
  });

  it('accepts valid PNG photo under 5 MiB', () => {
    // PNG header: 89 50 4E 47 0D 0A 1A 0A
    const file = makeFile([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'image/png', 2048);
    const result = validateUpload(file.contentType, file.buffer);
    expect(result.kind).toBe('photo');
    expect(result.contentType).toBe('image/png');
    expect(result.extension).toBe('png');
  });

  it('accepts valid WebM audio', () => {
    // WebM EBML ID: 1A 45 DF A3
    const file = makeFile([0x1a, 0x45, 0xdf, 0xa3], 'audio/webm', 5000);
    const result = validateUpload(file.contentType, file.buffer);
    expect(result.kind).toBe('word-audio');
    expect(result.contentType).toBe('audio/webm');
    expect(result.extension).toBe('webm');
  });

  it('rejects files larger than 5 MiB', () => {
    const file = makeFile([0xff, 0xd8, 0xff], 'image/jpeg', 5 * 1024 * 1024 + 1);
    expect(() => validateUpload(file.contentType, file.buffer)).toThrow(/too large/);
  });

  it('rejects empty files', () => {
    const file = makeFile([], 'image/jpeg', 0);
    expect(() => validateUpload(file.contentType, file.buffer)).toThrow(/empty/);
  });

  it('rejects spoofed MIME type when magic bytes do not match', () => {
    // Declared JPEG but contents are plain text / html
    const textBytes = [0x3c, 0x68, 0x74, 0x6d, 0x6c, 0x3e]; // <html>
    const file = makeFile(textBytes, 'image/jpeg', 100);
    expect(() => validateUpload(file.contentType, file.buffer)).toThrow(/Signature mismatch/);
  });

  it('rejects unsupported file types (SVG, HTML, executables)', () => {
    const svgBytes = [0x3c, 0x73, 0x76, 0x67]; // <svg
    const file = makeFile(svgBytes, 'image/svg+xml', 100);
    expect(() => validateUpload(file.contentType, file.buffer)).toThrow(/Unsupported file type/);
  });
});
