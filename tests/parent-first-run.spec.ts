import { NEW_PARENT, seedDatabase } from './support/seed';
import { expect, expectNoPrototypeLeftovers, signInAs, test } from './support/test';

test.describe('Parent first run', () => {
  test.beforeEach(async () => {
    // Fresh parent with no children, so the dashboard shows the first-run form.
    await seedDatabase();
  });

  test('inline child name, siblings, studio, finish, then play now', async ({
    page,

    baseURL,
  }) => {
    await signInAs(page, baseURL, NEW_PARENT);
    await page.goto('/parent');

    await expect(page.getByTestId('parent-dashboard-screen')).toBeVisible();
    await page.getByTestId('child-name-input').fill('Maya');
    await page.getByTestId('child-name-submit').click();

    // Pre-flight: the child's name is already filled in.
    await expect(page).toHaveURL(/\/parent\/profile\/[^/]+\/studio$/);
    await expect(page.getByLabel("Child's name")).toHaveValue('Maya');
    await expect(page.getByTestId('family-continue')).toBeVisible();

    // Sibling added with Enter, then another with the Add button.
    const siblingInput = page.getByLabel("Brother or sister's name");
    await siblingInput.fill('Sam');
    await siblingInput.press('Enter');
    await expect(page.getByTestId('sibling-list')).toContainText('Sam');
    await expect(siblingInput).toHaveValue('');

    await siblingInput.fill('Ellie');
    await page.getByTestId('add-sibling').click();
    await expect(page.getByTestId('sibling-list')).toContainText('Ellie');

    await page.getByTestId('family-continue').click();

    // Studio: first prompt keeps the natural case of the name.
    await expect(page.getByTestId('prompt-word')).toHaveText('Maya');
    await expect(page.getByTestId('prompt-card')).toBeVisible();

    await skipChapterOne(page);
    await page.getByRole('button', { name: "I'll finish later" }).click();

    await expect(page.getByTestId('play-code')).toHaveText(/^[A-Z0-9]{4,8}$/);
    const playCode = (await page.getByTestId('play-code').textContent()) ?? '';
    expect(playCode).not.toBe('');

    await page.getByRole('link', { name: 'Play now on this device' }).click();
    await expect(page).toHaveURL(new RegExp(`/play/${playCode}$`));
    await expect(page.getByRole('heading', { name: 'Hi Maya!' })).toBeVisible();
  });

  test('dashboard after setup lists the child with a play code and no prototype names', async ({
    page,

    baseURL,
  }) => {
    await signInAs(page, baseURL, NEW_PARENT);
    await page.goto('/parent');
    await page.getByTestId('child-name-input').fill('Maya');
    await page.getByTestId('child-name-submit').click();
    await expect(page).toHaveURL(/\/studio$/);

    await page.goto('/parent');
    await expect(page.getByTestId('child-card-name')).toHaveText('Maya');
    await expect(page.getByTestId('play-now-btn')).toBeVisible();
    await expectNoPrototypeLeftovers(page);
  });
});

/** Skips every name in chapter 1 so "I'll finish later" appears. */
async function skipChapterOne(page: import('@playwright/test').Page) {
  const skip = page.getByRole('button', { name: 'Skip this one' });
  const finishLater = page.getByRole('button', { name: "I'll finish later" });
  for (let step = 0; step < 15; step++) {
    await expect(skip.or(finishLater).first()).toBeVisible();
    if (await finishLater.isVisible()) return;
    await skip.click();
  }
  throw new Error("Chapter 1 never reached 'I'll finish later'");
}
