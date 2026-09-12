import { expect, test } from '@playwright/test';

test.describe('Foxwords Parent & Play Flows', () => {
  test('navigates from home to parent login', async ({ page }) => {
    await page.goto('/');
    const parentLink = page.getByRole('link', { name: /Grown-ups|Parent/i });
    await expect(parentLink).toBeVisible();
    await parentLink.click();

    await expect(page).toHaveURL(/\/parent\/login/);
    await expect(page.getByTestId('parent-login-screen')).toBeVisible();
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('submit-login')).toBeVisible();
  });

  test('submits parent email and lands on check-email feedback screen', async ({ page }) => {
    await page.goto('/parent/login');
    await page.getByTestId('email-input').fill('testparent@example.com');
    await page.getByTestId('submit-login').click();

    await expect(page).toHaveURL(/\/parent\/check-email?email=testparent%40example.com/);
    await expect(page.getByTestId('check-email-screen')).toBeVisible();
    await expect(page.getByText('Check your inbox')).toBeVisible();
    await expect(page.getByText('testparent@example.com')).toBeVisible();
  });

  test('interacts with child touch keypad on /join', async ({ page }) => {
    await page.goto('/join');
    await expect(page.getByTestId('join-screen')).toBeVisible();

    // Tap letters
    await page.getByRole('button', { name: 'F', exact: true }).click();
    const countO = await page.getByRole('button', { name: 'O', exact: true }).count();
    expect(countO).toBe(0); // 'O' excluded
    await page.getByRole('button', { name: 'X', exact: true }).click();
    await page.getByRole('button', { name: '2', exact: true }).click();

    // Verify code display has entered characters
    await expect(page.getByText('FX2')).toBeVisible();

    // Delete character
    await page.getByRole('button', { name: /Delete/i }).click();
    await expect(page.getByText('FX')).toBeVisible();

    // Clear code
    await page.getByRole('button', { name: /Clear/i }).click();
    await expect(page.getByText('······')).toBeVisible();
  });

  test('handles invalid play token gracefully on /play/[token]', async ({ page }) => {
    await page.goto('/play/INVALID_CODE_999');
    await expect(page.getByTestId('child-play-launcher')).toBeVisible();
    await expect(page.getByText(/This play link is no longer available/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Enter another code/i })).toBeVisible();
  });
});
