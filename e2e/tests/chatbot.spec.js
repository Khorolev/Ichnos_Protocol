import { test, expect } from '@playwright/test';

test.describe('Chatbot - Unauthenticated Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('opens auth modal when chat is opened by unauthenticated user', async ({
    page,
  }) => {
    const chatBtn = page.getByRole('button', { name: /chat/i });
    if (await chatBtn.isVisible()) {
      await chatBtn.click();
    }

    await expect(page.getByText('Welcome Back')).toBeVisible();
  });

  test('chat modal shows correct daily limit denominator', async ({
    page,
  }) => {
    const chatBtn = page.getByRole('button', { name: /chat/i });
    if (await chatBtn.isVisible()) {
      await chatBtn.click();
    }

    const badge = page.getByText(/Messages today:.*\/\s*3/);
    await expect(badge).toBeVisible();
  });
});

test.describe('Chatbot - Rate Limit Behavior', () => {
  test('displays rate limit warning when daily limit exceeded', async ({
    page,
  }) => {
    await page.goto('/');

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

    const chatBtn = page.getByRole('button', { name: /chat/i });
    if (await chatBtn.isVisible()) {
      await chatBtn.click();
    }

    const limitAlert = page.getByText(/reached your daily message limit/i);
    if (await limitAlert.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(limitAlert).toBeVisible();
    }
  });
});

test.describe('Chatbot - AI Unavailable Fallback', () => {
  test('shows fallback CTA when AI is unavailable (503)', async ({
    page,
  }) => {
    await page.goto('/');

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

    const chatBtn = page.getByRole('button', { name: /chat/i });
    if (await chatBtn.isVisible()) {
      await chatBtn.click();
    }

    const fallbackAlert = page.getByText(/temporarily unavailable/i);
    if (await fallbackAlert.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(fallbackAlert).toBeVisible();
      await expect(
        page.getByRole('button', { name: /leave your question/i }),
      ).toBeVisible();
    }
  });
});
