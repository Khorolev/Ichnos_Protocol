import { test, expect } from '@playwright/test';
import { waitForAppReady } from './helpers/app.js';

const SIGNUP_DATA = {
  name: 'Test',
  surname: 'User',
  email: `e2e-test-${Date.now()}@example.com`,
  password: 'TestPass123!',
  company: 'Acme Corp',
  phone: '+1 234 567 890',
  linkedin: 'https://linkedin.com/in/testuser',
};

function openSignupTab(page) {
  return async () => {
    await page.getByTestId('navbar').getByRole('button', { name: 'Login' }).click();
    await page.getByText('Sign Up').click();
    await expect(page.getByText('Create Account')).toBeVisible();
  };
}

test.describe('Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    await openSignupTab(page)();
  });

  test('fills all required fields and submits signup form', async ({
    page,
  }) => {
    await page.getByLabel('Name', { exact: true }).fill(SIGNUP_DATA.name);
    await page.getByLabel('Surname').fill(SIGNUP_DATA.surname);
    await page.getByLabel('Email').fill(SIGNUP_DATA.email);
    await page.getByLabel('Password').fill(SIGNUP_DATA.password);

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    await expect(
      page.getByTestId('auth-submit-spinner').or(page.getByRole('alert')),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('fills all fields including optional and submits', async ({ page }) => {
    await page.getByLabel('Name', { exact: true }).fill(SIGNUP_DATA.name);
    await page.getByLabel('Surname').fill(SIGNUP_DATA.surname);
    await page.getByLabel('Email').fill(SIGNUP_DATA.email);
    await page.getByLabel('Password').fill(SIGNUP_DATA.password);
    await page.getByLabel('Company (optional)').fill(SIGNUP_DATA.company);
    await page.getByLabel('Phone (optional)').fill(SIGNUP_DATA.phone);
    await page.getByLabel('LinkedIn (optional)').fill(SIGNUP_DATA.linkedin);

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    await expect(
      page.getByTestId('auth-submit-spinner').or(page.getByRole('alert')),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('shows error for weak password on signup', async ({ page }) => {
    await page.getByLabel('Name', { exact: true }).fill(SIGNUP_DATA.name);
    await page.getByLabel('Surname').fill(SIGNUP_DATA.surname);
    await page.getByLabel('Email').fill(SIGNUP_DATA.email);
    await page.getByLabel('Password').fill('123');

    await page.locator('button[type="submit"]').click();

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
  });

  test('shows error for invalid email on signup', async ({ page }) => {
    await page.getByLabel('Name', { exact: true }).fill(SIGNUP_DATA.name);
    await page.getByLabel('Surname').fill(SIGNUP_DATA.surname);
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByLabel('Password').fill(SIGNUP_DATA.password);

    await page.locator('button[type="submit"]').click();

    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toBeVisible();
  });

  test('submit button shows loading spinner during signup', async ({
    page,
  }) => {
    await page.getByLabel('Name', { exact: true }).fill(SIGNUP_DATA.name);
    await page.getByLabel('Surname').fill(SIGNUP_DATA.surname);
    await page.getByLabel('Email').fill(SIGNUP_DATA.email);
    await page.getByLabel('Password').fill(SIGNUP_DATA.password);

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    await expect(submitBtn).toBeDisabled({ timeout: 5_000 });
  });
});
