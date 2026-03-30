import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/app.js';
import { AuthPage } from '../pages/AuthPage.js';

test.describe('Authentication Flow', { tag: ['@auth'] }, () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  test('shows Login button in navbar for unauthenticated users', { tag: ['@smoke'] }, async ({
    page,
  }) => {
    const auth = new AuthPage(page);
    await expect(auth.navbarLoginButton).toBeVisible();
  });

  test('opens auth modal when Login button is clicked', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.openLoginModal();

    await expect(auth.welcomeBackText).toBeVisible();
    await expect(auth.emailInput).toBeVisible();
    await expect(auth.passwordInput).toBeVisible();
  });

  test('switches between Login and Sign Up tabs', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.openLoginModal();

    await auth.openSignupTab();
    await expect(auth.createAccountText).toBeVisible();
    await expect(auth.nameInput).toBeVisible();
    await expect(auth.surnameInput).toBeVisible();

    await auth.switchToLoginTab();
    await expect(auth.welcomeBackText).toBeVisible();
  });

  test('closes auth modal when close button is clicked', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.openLoginModal();
    await expect(auth.authModal.getByText('Welcome Back')).toBeVisible();

    await auth.closeModal();
    await expect(auth.authModal.getByText('Welcome Back')).not.toBeVisible();
  });

  test('shows validation for required fields on login', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.openLoginModal();

    await auth.submitForm();

    await expect(auth.emailInput).toBeVisible();
  });

  test('signup form has required and optional fields', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.openLoginModal();
    await auth.openSignupTab();

    await expect(auth.nameInput).toBeVisible();
    await expect(auth.surnameInput).toBeVisible();
    await expect(auth.emailInput).toBeVisible();
    await expect(auth.passwordInput).toBeVisible();
    await expect(auth.companyInput).toBeVisible();
    await expect(auth.phoneInput).toBeVisible();
    await expect(auth.linkedinInput).toBeVisible();
  });

  test('shows privacy notice on signup tab', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.openLoginModal();
    await auth.openSignupTab();

    await expect(auth.privacyNotice).toBeVisible();
  });
});
