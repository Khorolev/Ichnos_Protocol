import { test, expect } from '@playwright/test';
import { waitForAppReady, TIMEOUTS } from './helpers/app.js';
import { loginAsUser } from './helpers/auth.js';
import { USER, isConfigured } from './helpers/credentials.js';

test.describe('Logout Flow', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isConfigured(USER), 'User E2E credentials not configured');
    await waitForAppReady(page);
  });

  test('login button is replaced by user menu after authentication', async ({
    page,
  }) => {
    await loginAsUser(page);

    await expect(page.getByTestId('user-menu-toggle')).toBeVisible({
      timeout: TIMEOUTS.authVerify,
    });
  });

  test('user menu contains logout option when authenticated', async ({
    page,
  }) => {
    await loginAsUser(page);

    const userMenu = page.getByTestId('user-menu-toggle');
    await expect(userMenu).toBeVisible({ timeout: TIMEOUTS.authVerify });
    await userMenu.click();
    await expect(page.getByText('Logout')).toBeVisible();
  });

  test('logout returns user to unauthenticated state', async ({ page }) => {
    await loginAsUser(page);

    const userMenu = page.getByTestId('user-menu-toggle');
    await expect(userMenu).toBeVisible({ timeout: TIMEOUTS.authVerify });
    await userMenu.click();
    await page.getByText('Logout').click();

    await expect(
      page.getByRole('button', { name: 'Login' }),
    ).toBeVisible();
    await expect(userMenu).not.toBeVisible();
  });
});
