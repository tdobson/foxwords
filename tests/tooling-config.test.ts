import fs from 'node:fs';
import path from 'node:path';

describe('Tooling configuration', () => {
  const packageJsonPath = path.resolve(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  test('package name is foxwords', () => {
    expect(packageJson.name).toBe('foxwords');
  });

  test('lint invokes Biome rather than Oxlint', () => {
    expect(packageJson.scripts.lint).toContain('biome');
    expect(packageJson.scripts.lint).not.toContain('oxlint');
  });

  test('format:test invokes biome format check', () => {
    expect(
      packageJson.scripts['format:test'].includes('biome format') ||
        packageJson.scripts['format:test'].includes('biome check --formatter-enabled=true')
    ).toBe(true);
  });

  test('jest is run through scripts/low-priority.sh', () => {
    expect(packageJson.scripts.jest).toContain('scripts/low-priority.sh');
  });

  test('e2e invokes Playwright', () => {
    expect(packageJson.scripts.e2e).toContain('playwright');
  });

  test('no active script invokes next export or wrangler pages deploy', () => {
    const scripts = Object.values(packageJson.scripts || {}) as string[];
    for (const script of scripts) {
      expect(script).not.toContain('next export');
      expect(script).not.toContain('pages deploy');
      expect(script).not.toContain('output:export');
    }
  });
});
