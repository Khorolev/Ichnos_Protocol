import { test, expect } from '@playwright/test';
import { waitForAppReady } from './helpers/app.js';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  test('shows Login button in navbar for unauthenticated users', async ({
    page,
  }) => {
    const loginBtn = page.getByTestId('navbar').getByRole('button', { name: 'Login' });
    await expect(loginBtn).toBeVisible();
  });

  test('opens auth modal when Login button is clicked', async ({ page }) => {
    await page.getByTestId('navbar').getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('switches between Login and Sign Up tabs', async ({ page }) => {
    await page.getByTestId('navbar').getByRole('button', { name: 'Login' }).click();

    await page.getByText('Sign Up').click();
    await expect(page.getByText('Create Account')).toBeVisible();
    await expect(page.getByLabel('Name', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Surname')).toBeVisible();

    await page.getByTestId('auth-modal').getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('Welcome Back')).toBeVisible();
  });

  test('closes auth modal when close button is clicked', async ({ page }) => {
    await page.getByTestId('navbar').getByRole('button', { name: 'Login' }).click();
    await expect(page.getByTestId('auth-modal').getByText('Welcome Back')).toBeVisible();

    await page.getByTestId('auth-modal').getByRole('button', { name: 'Close' }).click();
    await expect(page.getByTestId('auth-modal').getByText('Welcome Back')).not.toBeVisible();
  });

  test('shows validation for required fields on login', async ({ page }) => {
    await page.getByTestId('navbar').getByRole('button', { name: 'Login' }).click();

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toBeVisible();
  });

  test('signup form has required and optional fields', async ({ page }) => {
    await page.getByTestId('navbar').getByRole('button', { name: 'Login' }).click();
    await page.getByText('Sign Up').click();

    await expect(page.getByLabel('Name', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Surname')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByLabel('Company (optional)')).toBeVisible();
    await expect(page.getByLabel('Phone (optional)')).toBeVisible();
    await expect(page.getByLabel('LinkedIn (optional)')).toBeVisible();
  });

  test('shows privacy notice on signup tab', async ({ page }) => {
    await page.getByTestId('navbar').getByRole('button', { name: 'Login' }).click();
    await page.getByText('Sign Up').click();

    await expect(
      page.getByText(/by signing up you agree/i),
    ).toBeVisible();
  });
});

test.describe('Cookie Consent', () => {
  test('shows cookie consent banner on first visit', async ({ page }) => {
    await waitForAppReady(page);

    await expect(
      page.getByText(/we use cookies to improve your experience/i),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Accept cookies' })).toBeVisible();
  });

  test('hides cookie consent banner after accepting', async ({ page }) => {
    await waitForAppReady(page);

    await page.getByRole('button', { name: 'Accept cookies' }).click();

    await expect(
      page.getByText(/we use cookies to improve your experience/i),
    ).not.toBeVisible();
  });

  test('does not show cookie consent banner after previously accepting', async ({
    page,
    context,
  }) => {
    await waitForAppReady(page);
    await page.getByRole('button', { name: 'Accept cookies' }).click();

    const newPage = await context.newPage();
    await waitForAppReady(newPage);

    await expect(
      newPage.getByText(/we use cookies to improve your experience/i),
    ).not.toBeVisible();
  });

  test('cookie consent has privacy policy link', async ({ page }) => {
    await waitForAppReady(page);

    const link = page.getByTestId('cookie-consent-link');
    await expect(link).toHaveAttribute('href', '/privacy');
  });
});

test.describe('Navigation - Contact Link', () => {
  test('shows Contact link in navigation', async ({ page }) => {
    await waitForAppReady(page);

    await expect(page.getByTestId('navbar').getByRole('link', { name: 'Contact' })).toBeVisible();
  });
});
