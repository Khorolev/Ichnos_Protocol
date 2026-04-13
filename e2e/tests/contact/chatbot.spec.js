import { test, expect } from '@playwright/test';
import { waitForAppReady, waitForAuthedAppReady } from '../helpers/app.js';
import { loginAsUser } from '../helpers/auth.js';
import { USER, isConfigured } from '../helpers/credentials.js';
import { ContactPage } from '../pages/ContactPage.js';
import { AuthPage } from '../pages/AuthPage.js';

test.describe('Chatbot - Unauthenticated Flow', { tag: ['@contact'] }, () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page, '/contact');
  });

  test('opens auth modal when chat is opened by unauthenticated user', async ({
    page,
  }) => {
    const contact = new ContactPage(page);
    const auth = new AuthPage(page);

    await contact.clickStartChat();

    await expect(auth.authModal).toBeVisible();
    await expect(
      auth.authModal.getByLabel('Email'),
    ).toBeVisible();
  });
});

test.describe('Chatbot - Authenticated Flow', { tag: ['@contact'] }, () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isConfigured(USER), 'User E2E credentials not configured');
    await loginAsUser(page);
    await waitForAuthedAppReady(page, '/contact');
  });

  test('chat modal shows correct daily limit denominator', async ({
    page,
  }) => {
    const contact = new ContactPage(page);
    await contact.clickStartChat();

    const badge = page.getByText(/Messages today:.*\/\s*3/);
    await expect(badge).toBeVisible();
  });
});

test.describe('Chatbot - Rate Limit Behavior (Authenticated)', { tag: ['@contact'] }, () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isConfigured(USER), 'User E2E credentials not configured');
    await loginAsUser(page);
    await waitForAuthedAppReady(page, '/contact');
  });

  test('displays rate limit warning when daily limit exceeded', async ({
    page,
  }) => {
    const contact = new ContactPage(page);

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

    await contact.clickStartChat();
    await expect(contact.chatTitle).toBeVisible();
    await contact.sendChatMessage('test rate limit');

    await expect(
      page.getByText(/reached your daily message limit/i),
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Chatbot - AI Unavailable Fallback (Authenticated)', { tag: ['@contact'] }, () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isConfigured(USER), 'User E2E credentials not configured');
    await loginAsUser(page);
    await waitForAuthedAppReady(page, '/contact');
  });

  test('shows fallback CTA when AI is unavailable (503)', async ({
    page,
  }) => {
    const contact = new ContactPage(page);

    await page.route('**/api/chat/message', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'event: error\ndata: {"code":"STREAM_ERROR","message":"AI temporarily unavailable"}\n\n',
      }),
    );

    await contact.clickStartChat();
    await expect(contact.chatTitle).toBeVisible();
    await contact.sendChatMessage('test ai unavailable');

    await expect(
      page.getByText(/temporarily unavailable/i),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole('button', { name: /leave your question/i }),
    ).toBeVisible();
  });
});
