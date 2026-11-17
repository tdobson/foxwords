import { FAMILY_PARENT, JUNIPER, seedDatabase } from './support/seed';
import { expect, signInAs, test } from './support/test';

test.describe('Connect a device', () => {
  test.beforeEach(async () => {
    await seedDatabase();
  });

  test('shows the family code, play link and QR code', async ({ page, baseURL }) => {
    await signInAs(page, baseURL, FAMILY_PARENT);
    await page.goto(`/parent/profile/${JUNIPER.profileId}/connect`);

    await expect(page.getByTestId('connect-device-screen')).toBeVisible();
    await expect(page.getByTestId('connect-family-code')).toHaveAttribute(
      'aria-label',
      `Family code ${JUNIPER.playCode}`
    );

    const link = page.getByTestId('connect-play-link');
    await expect(link).toContainText(`/play/${JUNIPER.playCode}`);
    await expect(link).toHaveAttribute('href', `/play/${JUNIPER.playCode}`);

    await expect(page.getByTestId('connect-qr')).toBeVisible();
    await expect(page.getByTestId('open-on-device-btn')).toBeVisible();
  });

  test('open on this device goes to the play page', async ({ page, baseURL }) => {
    await signInAs(page, baseURL, FAMILY_PARENT);
    await page.goto(`/parent/profile/${JUNIPER.profileId}/connect`);

    await page.getByTestId('open-on-device-btn').click();
    await expect(page).toHaveURL(new RegExp(`/play/${JUNIPER.playCode}$`));
    await expect(page.getByRole('heading', { name: 'Hi Juniper!' })).toBeVisible();
  });
});
