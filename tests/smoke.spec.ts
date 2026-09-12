import { expect, test } from '@playwright/test';

test.describe('Foxwords root smoke test', () => {
  test('loads root launcher and navigates to join screen', async ({ page }) => {
    await page.goto('/');

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toContainText('Foxwords');

    const joinButton = page.getByTestId('join-code-button');
    await expect(joinButton).toBeVisible();
    await joinButton.click();

    await expect(page).toHaveURL(/\/join/);
    await expect(page.getByTestId('join-screen')).toBeVisible();
  });
});
