import { devices } from '@playwright/test';
import { JUNIPER, seedDatabase } from './support/seed';
import { expect, test } from './support/test';

// The iPad descriptor minus its browser hint: the suite runs these on Chromium.
const { defaultBrowserType: _browser, ...ipad } = devices['iPad (gen 7)'];
test.use(ipad);

test.describe('Child on an iPad', () => {
  test.beforeEach(async ({ browserName: _browserName }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium-tablet',
      'iPad coverage runs once, in the tablet project'
    );
    await seedDatabase();
  });

  test('shows the tap-to-type target and no on-screen keypad', async ({ page }) => {
    await page.goto(`/play/${JUNIPER.playCode}`);
    await page.getByRole('link', { name: 'Words', exact: true }).tap();
    await expect(page.getByRole('region', { name: 'Prompt for Juniper' })).toBeVisible();

    await expect(page.getByTestId('child-type-target')).toBeVisible();
    await expect(page.getByTestId('child-keyboard')).toHaveCount(0);
  });

  test('tapping the target focuses the hidden input and typing advances the word', async ({
    page,
  }) => {
    await page.goto(`/play/${JUNIPER.playCode}`);
    await page.getByRole('link', { name: 'Words', exact: true }).tap();
    await expect(page.getByTestId('child-type-target')).toBeVisible();

    await page.getByTestId('child-type-target').tap();
    const hiddenInput = page.getByTestId('child-type-input');
    await expect(hiddenInput).toBeFocused();

    const tiles = page.getByRole('list', { name: 'Word letter tiles' });
    await hiddenInput.pressSequentially('JUN');
    await expect(tiles.locator('li[data-state="completed"]')).toHaveCount(3);

    await hiddenInput.pressSequentially('IPER');
    await expect(tiles.locator('li[data-state="completed"]')).toHaveCount(JUNIPER.childName.length);
  });
});
