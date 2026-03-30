import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/app.js';

test.describe('Cookie Consent', { tag: ['@smoke'] }, () => {
  test('shows cookie consent banner on first visit', async ({ page }) => {
    await waitForAppReady(page);

    await expect(
      page.getByText(/we use cookies to improve your experience/i),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Accept cookies' })).toBeVisible();
  });

  test('hides cookie consent banner after accepting', async ({ page }) => {
    await waitForAppReady(page);

    await page.getByRole('button', { name: 'Accept cookies' }).click();

    await expect(
      page.getByText(/we use cookies to improve your experience/i),
    ).not.toBeVisible();
  });

  test('does not show cookie consent banner after previously accepting', async ({
    page,
    context,
  }) => {
    await waitForAppReady(page);
    await page.getByRole('button', { name: 'Accept cookies' }).click();

    const newPage = await context.newPage();
    await waitForAppReady(newPage);

    await expect(
      newPage.getByText(/we use cookies to improve your experience/i),
    ).not.toBeVisible();
  });

  test('cookie consent has privacy policy link', async ({ page }) => {
    await waitForAppReady(page);

    const link = page.getByTestId('cookie-consent-link');
    await expect(link).toHaveAttribute('href', '/privacy');
  });
});

test.describe('Navigation - Contact Link', { tag: ['@smoke'] }, () => {
  test('shows Contact link in navigation', async ({ page }) => {
    await waitForAppReady(page);

    await expect(page.getByTestId('navbar').getByRole('link', { name: 'Contact' })).toBeVisible();
  });
});
