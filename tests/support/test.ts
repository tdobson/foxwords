import { test as base, expect, type Page } from '@playwright/test';
import { mockAudio } from './audio';
import { SESSION_COOKIE, type SeedParent } from './seed';

export const test = base.extend<{ audioMock: undefined }>({
  // Every test runs with TTS and audio mocked; nothing reaches OpenRouter or a real clip.
  audioMock: [
    async ({ context }, use) => {
      await mockAudio(context);
      await use();
    },
    { auto: true },
  ],
});

export { expect };

/**
 * Signs the browser in as a seeded parent with the same cookie the magic link sets.
 * Set through CDP because Playwright's addCookies always adds a Domain attribute,
 * which the __Host- prefix forbids.
 */
export async function signInAs(page: Page, baseURL: string | undefined, parent: SeedParent) {
  if (!baseURL) throw new Error('baseURL is required to set the session cookie');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.setCookie', {
    name: SESSION_COOKIE,
    value: parent.sessionToken,
    url: baseURL,
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  });
}

/** Fails the test if the copy still shows the single-family prototype's names. */
export async function expectNoPrototypeLeftovers(page: Page) {
  await expect(page.locator('body')).not.toContainText(/\b(Tim|James|Sarah)\b/);
}
