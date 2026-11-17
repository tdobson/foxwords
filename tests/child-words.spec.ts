import { JUNIPER, seedDatabase } from './support/seed';
import { expect, expectNoPrototypeLeftovers, test } from './support/test';

const WORD_TILES = 'Word letter tiles';

test.describe('Child plays Words with a keyboard', () => {
  test.beforeEach(async () => {
    await seedDatabase();
  });

  test('play page greets the child and Words starts on her name', async ({ page }) => {
    await page.goto(`/play/${JUNIPER.playCode}`);
    await expect(page.getByRole('heading', { name: 'Hi Juniper!' })).toBeVisible();
    await expectNoPrototypeLeftovers(page);

    await page.getByRole('link', { name: 'Words', exact: true }).click();
    await expect(page).toHaveURL(/\/words$/);

    await expect(page.getByRole('region', { name: 'Prompt for Juniper' })).toBeVisible();
    await expect(page.locator('body')).not.toContainText('James');
    await expect(page.getByRole('list', { name: WORD_TILES }).getByRole('listitem')).toHaveCount(
      JUNIPER.childName.length
    );
  });

  test('typing the letters on a keyboard completes the word', async ({ page }) => {
    await page.goto(`/play/${JUNIPER.playCode}`);
    await page.getByRole('link', { name: 'Words', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Prompt for Juniper' })).toBeVisible();

    const tiles = page.getByRole('list', { name: WORD_TILES });
    await page.keyboard.type('JUN');
    await expect(tiles.locator('li[data-state="completed"]')).toHaveCount(3);

    await page.keyboard.type('IPER');
    await expect(tiles.locator('li[data-state="completed"]')).toHaveCount(JUNIPER.childName.length);
  });
});

test.describe('Play page errors', () => {
  test('an unknown play code explains what to do', async ({ page }) => {
    await page.goto('/play/INVALID_CODE_999');
    await expect(page.getByTestId('child-play-launcher')).toBeVisible();
    await expect(page.getByText(/This play link is no longer available/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Enter another code' })).toBeVisible();
  });
});
