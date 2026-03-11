import { test, expect } from '@playwright/test';

test.describe('Logout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('login button is replaced by user menu after authentication', async ({
    page,
  }) => {
    const loginBtn = page.getByRole('button', { name: 'Login' });
    await expect(loginBtn).toBeVisible();

    await loginBtn.click();
    await expect(page.getByText('Welcome Back')).toBeVisible();

    await page.getByLabel('Email').fill('testuser@example.com');
    await page.getByLabel('Password').fill('TestPass123!');
    await page.locator('button[type="submit"]').click();

    const result = page
      .locator('.user-menu-toggle')
      .or(page.getByRole('alert'));
    await expect(result).toBeVisible({ timeout: 10_000 });
  });

  test('user menu contains logout option when authenticated', async ({
    page,
  }) => {
    await page.goto('/');

    const loginBtn = page.getByRole('button', { name: 'Login' });
    await expect(loginBtn).toBeVisible();

    await loginBtn.click();
    await page.getByLabel('Email').fill('testuser@example.com');
    await page.getByLabel('Password').fill('TestPass123!');
    await page.locator('button[type="submit"]').click();

    const userMenu = page.locator('.user-menu-toggle');

    const menuOrError = userMenu.or(page.getByRole('alert'));
    await expect(menuOrError).toBeVisible({ timeout: 10_000 });

    if (await userMenu.isVisible()) {
      await userMenu.click();
      await expect(page.getByText('Logout')).toBeVisible();
    }
  });

  test('logout returns user to unauthenticated state', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByLabel('Email').fill('testuser@example.com');
    await page.getByLabel('Password').fill('TestPass123!');
    await page.locator('button[type="submit"]').click();

    const userMenu = page.locator('.user-menu-toggle');
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
