import { expect, test } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      name: 'HyperType turns code into a fast, replayable typing arena.',
    }),
  ).toBeVisible();
});
