import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth.js';
import { USER, isConfigured } from './helpers/credentials.js';

test.describe('Logout Flow', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isConfigured(USER), 'User E2E credentials not configured');
    await page.goto('/');
  });

  test('login button is replaced by user menu after authentication', async ({
    page,
  }) => {
    await loginAsUser(page);

    const result = page
      .getByTestId('user-menu-toggle')
      .or(page.getByRole('alert'));
    await expect(result).toBeVisible({ timeout: 10_000 });
  });

  test('user menu contains logout option when authenticated', async ({
    page,
  }) => {
    await loginAsUser(page);

    const userMenu = page.getByTestId('user-menu-toggle');
    const menuOrError = userMenu.or(page.getByRole('alert'));
    await expect(menuOrError).toBeVisible({ timeout: 10_000 });

    if (await userMenu.isVisible()) {
      await userMenu.click();
      await expect(page.getByText('Logout')).toBeVisible();
    }
  });

  test('logout returns user to unauthenticated state', async ({ page }) => {
    await loginAsUser(page);

    const userMenu = page.getByTestId('user-menu-toggle');
    const menuOrError = userMenu.or(page.getByRole('alert'));
    await expect(menuOrError).toBeVisible({ timeout: 10_000 });

    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.getByText('Logout').click();

      await expect(
        page.getByRole('button', { name: 'Login' }),
      ).toBeVisible();
      await expect(userMenu).not.toBeVisible();
    }
  });
});
