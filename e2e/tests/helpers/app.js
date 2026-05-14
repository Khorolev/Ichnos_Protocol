import { expect } from '@playwright/test';

const IS_CI = !!process.env.CI;

export const TIMEOUTS = {
  action: IS_CI ? 15_000 : 10_000,
  navigation: IS_CI ? 30_000 : 15_000,
  appReady: IS_CI ? 30_000 : 15_000,
  authVerify: IS_CI ? 20_000 : 10_000,
};

export async function waitForAppReady(page, path = '/', timeout = TIMEOUTS.appReady) {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout });
  await expect(page.locator('#root')).not.toBeEmpty({ timeout });
}

/**
 * Wait for the app to be ready AND auth state to be fully restored.
 *
 * After a full page navigation (goto), Firebase auth restoration from
 * IndexedDB is asynchronous. Components that check `isAuthenticated`
 * (e.g. ContactForm, ChatModal) may open an auth modal if the test
 * interacts with the page before auth is restored.
 *
 * This helper waits for the user menu toggle to appear, which signals
 * that the auth state has been fully resolved.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} path - Route to navigate to
 */
export async function waitForAuthedAppReady(page, path = '/') {
  await waitForAppReady(page, path);
  await expect(
    page.getByTestId('user-menu-toggle').first(),
  ).toBeVisible({ timeout: TIMEOUTS.authVerify });
}
