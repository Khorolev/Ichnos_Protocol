import { test, expect } from '@playwright/test';
import { USER, isConfigured } from './helpers/credentials.js';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isConfigured(USER), 'User E2E credentials not configured');
    await page.goto('/');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('Welcome Back')).toBeVisible();
  });

  test('fills login form and submits', async ({ page }) => {
    await page.getByLabel('Email').fill(USER.email);
    await page.getByLabel('Password').fill(USER.password);

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    await expect(
      page.getByTestId('auth-submit-spinner').or(page.getByRole('alert')),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('WrongPassword123!');

    await page.locator('button[type="submit"]').click();

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
  });

  test('submit button disables during login attempt', async ({ page }) => {
    await page.getByLabel('Email').fill(USER.email);
    await page.getByLabel('Password').fill(USER.password);

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    await expect(submitBtn).toBeDisabled({ timeout: 5_000 });
  });

  test('displays Firebase error message on auth failure', async ({
    page,
  }) => {
    await page.getByLabel('Email').fill('nonexistent@example.com');
    await page.getByLabel('Password').fill('SomePassword1!');

    await page.locator('button[type="submit"]').click();

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible({ timeout: 10_000 });
    await expect(alert).not.toBeEmpty();
  });

  test('clears error when switching to signup tab', async ({ page }) => {
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('bad');
    await page.locator('button[type="submit"]').click();

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });

    await page.getByText('Sign Up').click();

    await expect(page.getByRole('alert')).not.toBeVisible();
  });
});
