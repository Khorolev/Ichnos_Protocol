import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/app.js';
import { USER, isConfigured } from '../helpers/credentials.js';
import { AuthPage } from '../pages/AuthPage.js';

test.describe('Login Flow', { tag: ['@auth'] }, () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isConfigured(USER), 'User E2E credentials not configured');
    await waitForAppReady(page);
    const auth = new AuthPage(page);
    await auth.openLoginModal();
    await expect(auth.welcomeBackText).toBeVisible();
  });

  test('fills login form and submits', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.fillLoginForm(USER.email, USER.password);
    await auth.submitForm();

    await expect(auth.userMenuToggle).toBeVisible({
      timeout: 15_000,
    });
  });

  test('shows error for invalid credentials', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.fillLoginForm('wrong@example.com', 'WrongPassword123!');
    await auth.submitForm();

    await expect(auth.alert).toBeVisible({ timeout: 10_000 });
  });

  test('submit button disables during login attempt', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.fillLoginForm(USER.email, USER.password);
    await auth.submitForm();

    await expect(auth.submitButton).toBeDisabled({ timeout: 5_000 });
  });

  test('displays Firebase error message on auth failure', async ({
    page,
  }) => {
    const auth = new AuthPage(page);
    await auth.fillLoginForm('nonexistent@example.com', 'SomePassword1!');
    await auth.submitForm();

    await expect(auth.alert).toBeVisible({ timeout: 10_000 });
    await expect(auth.alert).not.toBeEmpty();
  });

  test('clears error when switching to signup tab', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.fillLoginForm('wrong@example.com', 'bad');
    await auth.submitForm();

    await expect(auth.alert).toBeVisible({ timeout: 10_000 });

    await auth.openSignupTab();

    await expect(auth.alert).not.toBeVisible({ timeout: 3000 });
  });
});
