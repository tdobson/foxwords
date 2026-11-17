import { JUNIPER } from './support/seed';
import { expect, test } from './support/test';

test.describe('Join with a family code', () => {
  test('tapping the code on the keypad opens the play page', async ({ page }) => {
    await page.goto('/join');
    await expect(page.getByTestId('join-screen')).toBeVisible();

    for (const key of JUNIPER.playCode) {
      await page.getByRole('button', { name: key, exact: true }).click();
    }
    await expect(page.getByText(JUNIPER.playCode, { exact: true })).toBeVisible();

    await page.getByRole('button', { name: "LET'S PLAY!" }).click();

    await expect(page).toHaveURL(new RegExp(`/play/${JUNIPER.playCode}$`));
    await expect(page.getByRole('heading', { name: 'Hi Juniper!' })).toBeVisible();
  });

  test('Delete and Clear edit the code before it is submitted', async ({ page }) => {
    await page.goto('/join');
    for (const key of ['F', 'X', '2']) {
      await page.getByRole('button', { name: key, exact: true }).click();
    }
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('FX', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.getByText('······')).toBeVisible();
  });

  test('an unknown code shows a friendly error and stays on the page', async ({ page }) => {
    await page.goto('/join');
    for (const key of ['2', '3', '4']) {
      await page.getByRole('button', { name: key, exact: true }).click();
    }
    await page.getByRole('button', { name: "LET'S PLAY!" }).click();
    await expect(page.getByText('Code not found. Check the letters and try again.')).toBeVisible();
    await expect(page).toHaveURL(/\/join$/);
  });
});
