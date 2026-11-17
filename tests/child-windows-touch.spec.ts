import { JUNIPER, seedDatabase } from './support/seed';
import { expect, test } from './support/test';

const WINDOWS_TOUCH_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Touch';

test.use({
  userAgent: WINDOWS_TOUCH_UA,
  hasTouch: true,
  isMobile: false,
  viewport: { width: 1280, height: 800 },
});

test.describe('Child on a Windows touch tablet', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'runs once, in the desktop project');
    await seedDatabase();
    // A touch-only tablet has a coarse pointer and no mouse, so say so explicitly.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'pointer', value: 'coarse' },
        { name: 'any-pointer', value: 'coarse' },
        { name: 'hover', value: 'none' },
        { name: 'any-hover', value: 'none' },
      ],
    });
  });

  test('shows the on-screen letter keyboard and tapping keys completes the word', async ({
    page,
  }) => {
    await page.goto(`/play/${JUNIPER.playCode}`);
    await page.getByRole('link', { name: 'Words', exact: true }).tap();
    await expect(page.getByRole('region', { name: 'Prompt for Juniper' })).toBeVisible();

    await expect(page.getByTestId('child-keyboard')).toBeVisible();
    await expect(page.getByTestId('child-type-target')).toHaveCount(0);

    for (const letter of JUNIPER.childName.toUpperCase()) {
      await page.getByTestId(`child-key-${letter}`).tap();
    }

    const tiles = page.getByRole('list', { name: 'Word letter tiles' });
    await expect(tiles.locator('li[data-state="completed"]')).toHaveCount(JUNIPER.childName.length);
  });
});
