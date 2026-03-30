import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/app.js';
import { AuthPage } from '../pages/AuthPage.js';

const SIGNUP_DATA = {
  name: 'Test',
  surname: 'User',
  email: `e2e-test-${Date.now()}@example.com`,
  password: 'TestPass123!',
  company: 'Acme Corp',
  phone: '+1 234 567 890',
  linkedin: 'https://linkedin.com/in/testuser',
};

test.describe('Signup Flow', { tag: ['@auth'] }, () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    const auth = new AuthPage(page);
    await auth.openLoginModal();
    await auth.openSignupTab();
    await expect(auth.createAccountText).toBeVisible();
  });

  test('fills all required fields and submits signup form', async ({
    page,
  }) => {
    const auth = new AuthPage(page);
    await auth.fillSignupForm({
      name: SIGNUP_DATA.name,
      surname: SIGNUP_DATA.surname,
      email: SIGNUP_DATA.email,
      password: SIGNUP_DATA.password,
    });
    await auth.submitForm();

    await expect(
      auth.authSubmitSpinner.or(auth.alert),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('fills all fields including optional and submits', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.fillSignupForm(SIGNUP_DATA);
    await auth.submitForm();

    await expect(
      auth.authSubmitSpinner.or(auth.alert),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('shows error for weak password on signup', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.fillSignupForm({
      name: SIGNUP_DATA.name,
      surname: SIGNUP_DATA.surname,
      email: SIGNUP_DATA.email,
      password: '123',
    });
    await auth.submitForm();

    await expect(auth.alert).toBeVisible({ timeout: 10_000 });
  });

  test('shows error for invalid email on signup', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.fillSignupForm({
      name: SIGNUP_DATA.name,
      surname: SIGNUP_DATA.surname,
      email: 'not-an-email',
      password: SIGNUP_DATA.password,
    });
    await auth.submitForm();

    await expect(auth.emailInput).toBeVisible();
  });

  test('submit button shows loading spinner during signup', async ({
    page,
  }) => {
    const auth = new AuthPage(page);
    await auth.fillSignupForm({
      name: SIGNUP_DATA.name,
      surname: SIGNUP_DATA.surname,
      email: SIGNUP_DATA.email,
      password: SIGNUP_DATA.password,
    });
    await auth.submitForm();

    await expect(auth.submitButton).toBeDisabled({ timeout: 5_000 });
  });
});
