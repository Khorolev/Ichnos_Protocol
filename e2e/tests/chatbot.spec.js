import { test, expect } from '@playwright/test';
import { waitForAppReady } from './helpers/app.js';
import { loginAsUser } from './helpers/auth.js';
import { USER, isConfigured } from './helpers/credentials.js';

test.describe('Chatbot - Unauthenticated Flow', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page, '/contact');
  });

  test('opens auth modal when chat is opened by unauthenticated user', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Start Chat' }).click();

    await expect(page.getByTestId('auth-modal')).toBeVisible();
    await expect(
      page.getByTestId('auth-modal').getByLabel('Email'),
    ).toBeVisible();
  });
});

test.describe('Chatbot - Authenticated Flow', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isConfigured(USER), 'User E2E credentials not configured');
    await loginAsUser(page);
    await waitForAppReady(page, '/contact');
  });

  test('chat modal shows correct daily limit denominator', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Start Chat' }).click();

    const badge = page.getByText(/Messages today:.*\/\s*3/);
    await expect(badge).toBeVisible();
  });
});

test.describe('Chatbot - Rate Limit Behavior (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isConfigured(USER), 'User E2E credentials not configured');
    await loginAsUser(page);
    await waitForAppReady(page, '/contact');
  });

  test('displays rate limit warning when daily limit exceeded', async ({
    page,
  }) => {
    await page.route('**/api/chat/message', (route) =>
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          error: 'Daily message limit reached (3/day)',
          message: '',
        }),
      }),
    );

    await page.getByRole('button', { name: 'Start Chat' }).click();
    await expect(page.getByText('Chat with Ichnos AI')).toBeVisible();
    await page.getByPlaceholder('Type your message...').fill('test rate limit');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(
      page.getByText(/reached your daily message limit/i),
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Chatbot - AI Unavailable Fallback (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isConfigured(USER), 'User E2E credentials not configured');
    await loginAsUser(page);
    await waitForAppReady(page, '/contact');
  });

  test('shows fallback CTA when AI is unavailable (503)', async ({
    page,
  }) => {
    await page.route('**/api/chat/message', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          error: 'xAI API unavailable',
          message: '',
        }),
      }),
    );

    await page.getByRole('button', { name: 'Start Chat' }).click();
    await expect(page.getByText('Chat with Ichnos AI')).toBeVisible();
    await page.getByPlaceholder('Type your message...').fill('test ai unavailable');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(
      page.getByText(/temporarily unavailable/i),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole('button', { name: /leave your question/i }),
    ).toBeVisible();
  });
});
