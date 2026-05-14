import { test, expect } from '@playwright/test';
import { waitForAppReady, TIMEOUTS } from '../helpers/app.js';
import { loginAsUser } from '../helpers/auth.js';
import { USER, isConfigured } from '../helpers/credentials.js';
import { AuthPage } from '../pages/AuthPage.js';

test.describe('Logout Flow', { tag: ['@auth'] }, () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isConfigured(USER), 'User E2E credentials not configured');
    await waitForAppReady(page);
  });

  test('login button is replaced by user menu after authentication', async ({
    page,
  }) => {
    await loginAsUser(page);
    const auth = new AuthPage(page);

    await expect(auth.userMenuToggle).toBeVisible({
      timeout: TIMEOUTS.authVerify,
    });
  });

  test('user menu contains logout option when authenticated', async ({
    page,
  }) => {
    await loginAsUser(page);
    const auth = new AuthPage(page);

    await expect(auth.userMenuToggle).toBeVisible({ timeout: TIMEOUTS.authVerify });
    await auth.openUserMenu();
    await expect(auth.logoutText).toBeVisible();
  });

  test('logout returns user to unauthenticated state', async ({ page }) => {
    await loginAsUser(page);
    const auth = new AuthPage(page);

    await expect(auth.userMenuToggle).toBeVisible({ timeout: TIMEOUTS.authVerify });
    await auth.openUserMenu();
    await auth.clickLogout();

    await expect(
      page.getByTestId('navbar').getByRole('button', { name: 'Login' }),
    ).toBeVisible();
    await expect(auth.userMenuToggle).not.toBeVisible();
  });
});
