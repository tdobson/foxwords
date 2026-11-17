import { expect, test } from './support/test';

test.describe('Public sign-up', () => {
  test('home leads to the parent login, then the check-email screen with resend', async ({
    page,
  }) => {
    const email = `signup.${Date.now()}@e2e.foxwords.test`;

    await page.goto('/');
    await page.getByTestId('parent-setup-button').click();

    await expect(page).toHaveURL(/\/parent\/login$/);
    await expect(page.getByTestId('parent-login-screen')).toBeVisible();
    await page.getByTestId('email-input').fill(email);
    await page.getByTestId('submit-login').click();

    await expect(page).toHaveURL(/\/parent\/check-email\?email=/);
    await expect(page.getByTestId('check-email-screen')).toBeVisible();
    await expect(page.getByTestId('check-email-address')).toContainText(email);
    await expect(page.getByTestId('check-spam-hint')).toBeVisible();
    await expect(page.getByTestId('resend-link-btn')).toBeEnabled();
    await expect(page.getByTestId('use-different-email-btn')).toBeVisible();
  });

  test('resend shows a confirmation and starts the cooldown', async ({ page }) => {
    const email = `resend.${Date.now()}@e2e.foxwords.test`;
    await page.goto(`/parent/check-email?email=${encodeURIComponent(email)}`);

    const resend = page.getByTestId('resend-link-btn');
    await expect(resend).toBeEnabled();
    await resend.click();

    await expect(page.getByTestId('resend-notice')).toHaveText(
      'A fresh sign-in link is on its way.'
    );
    await expect(resend).toBeDisabled();
    await expect(resend).toHaveText(/Resend link in \d+s/);
  });

  test('home page is free of prototype leftovers', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Foxwords');
    await expect(page.locator('body')).not.toContainText(/\b(Tim|James|Sarah)\b/);
  });
});
