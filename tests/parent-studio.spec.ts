import { FAMILY_PARENT, JUNIPER, seedDatabase } from './support/seed';
import { expect, signInAs, test } from './support/test';

test.describe('Voice studio', () => {
  test.beforeEach(async () => {
    await seedDatabase();
  });

  test('records and keeps a family prompt with the fake microphone', async ({
    page,

    baseURL,
  }) => {
    await signInAs(page, baseURL, FAMILY_PARENT);
    await page.goto(`/parent/profile/${JUNIPER.profileId}/studio`);

    // Pre-flight remembers the saved sibling.
    await expect(page.getByLabel("Child's name")).toHaveValue(JUNIPER.childName);
    await expect(page.getByTestId('sibling-list')).toContainText('Sam');
    await page.getByTestId('family-continue').click();

    await expect(page.getByTestId('prompt-word')).toHaveText(JUNIPER.childName);

    await page.getByTestId('record-button').click();
    await expect(page.getByRole('button', { name: 'Stop recording' })).toBeVisible();

    // Recording stops by itself after a few seconds and offers a review.
    await expect(page.getByTestId('keep-button')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('keep-button').click();

    await expect(page.getByTestId('last-saved')).toContainText(`Saved ${JUNIPER.childName}`);
  });
});
