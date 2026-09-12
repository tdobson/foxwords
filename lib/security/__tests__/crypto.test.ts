import { normalizeEmail, normalizePlayCode, randomToken, sha256Hex, validateWord } from '../crypto';

describe('Security Crypto & Sanitization', () => {
  describe('randomToken', () => {
    it('generates URL-safe token of expected byte length', () => {
      const token1 = randomToken(32);
      const token2 = randomToken(32);
      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThanOrEqual(42);
      expect(/^[A-Za-z0-9_-]+$/.test(token1)).toBe(true);
    });
  });

  describe('sha256Hex', () => {
    it('returns deterministic SHA-256 hex string', async () => {
      const hash1 = await sha256Hex('hello world');
      const hash2 = await sha256Hex('hello world');
      expect(hash1).toBe(hash2);
      expect(hash1).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    });
  });

  describe('normalizeEmail', () => {
    it('lowercases and trims valid email', () => {
      expect(normalizeEmail('  Parent@Example.COM ')).toBe('parent@example.com');
    });

    it('rejects invalid email structures', () => {
      expect(() => normalizeEmail('')).toThrow(/Invalid email/);
      expect(() => normalizeEmail('notanemail')).toThrow(/Invalid email/);
      expect(() => normalizeEmail('@empty.com')).toThrow(/Invalid email/);
      expect(() => normalizeEmail('user@')).toThrow(/Invalid email/);
    });
  });

  describe('validateWord', () => {
    it('accepts valid uppercase letters, hyphens, and apostrophes', () => {
      expect(validateWord('MAYA')).toBe('MAYA');
      expect(validateWord('tractor')).toBe('TRACTOR');
      expect(validateWord('TEDDY-BEAR')).toBe('TEDDY-BEAR');
      expect(validateWord("O'BRIEN")).toBe("O'BRIEN");
    });

    it('rejects empty, overlong, or malicious characters', () => {
      expect(() => validateWord('')).toThrow();
      expect(() => validateWord('   ')).toThrow();
      expect(() => validateWord('A'.repeat(33))).toThrow(/too long/);
      expect(() => validateWord('<script>')).toThrow();
      expect(() => validateWord('CAT 123')).toThrow();
    });
  });

  describe('normalizePlayCode', () => {
    it('normalizes alphanumeric codes and strips single hyphens', () => {
      expect(normalizePlayCode('abc-123')).toBe('ABC123');
      expect(normalizePlayCode('xyz9')).toBe('XYZ9');
    });

    it('rejects invalid length or invalid characters', () => {
      expect(() => normalizePlayCode('ab')).toThrow();
      expect(() => normalizePlayCode('toolongcode123')).toThrow();
      expect(() => normalizePlayCode('a$#1')).toThrow();
      expect(() => normalizePlayCode('A-B-C-D')).toThrow(/at most one hyphen/);
      expect(() => normalizePlayCode('AB--CD')).toThrow(/at most one hyphen/);
      expect(() => normalizePlayCode('-ABC1')).toThrow(/cannot be at start or end/);
      expect(() => normalizePlayCode('ABC1-')).toThrow(/cannot be at start or end/);
    });
  });
});
