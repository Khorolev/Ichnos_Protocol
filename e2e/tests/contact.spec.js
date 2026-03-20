import { test, expect } from '@playwright/test';
import { waitForAppReady } from './helpers/app.js';
import { loginAsUser } from './helpers/auth.js';
import { USER, isConfigured } from './helpers/credentials.js';

test.describe('Contact Page - Public Access', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page, '/contact');
  });

  test('displays all contact options', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Get in Touch');
    await expect(page.getByRole('button', { name: 'Start Chat' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit Inquiry' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Book a Meeting' })).toBeVisible();
  });
});

test.describe('Contact Page - Submit Inquiry', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isConfigured(USER), 'User E2E credentials not configured');
    await loginAsUser(page);
    await waitForAppReady(page, '/contact');
  });

  test('submit an inquiry successfully', async ({ page }) => {
    await page.getByRole('button', { name: 'Submit Inquiry' }).click();
    await expect(page.getByText('Submit an Inquiry')).toBeVisible();

    await page.getByLabel('Question 1').fill('Test inquiry from E2E');
    await page.getByRole('checkbox').click();

    await page.route('**/api/contact/submit', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ data: {}, message: 'ok' }),
      }),
    );

    const modal = page.getByTestId('contact-modal');
    await modal.getByRole('button', { name: 'Submit Inquiry' }).click();

    await expect(page.getByText(/inquiry submitted/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Book a Meeting' })).toBeVisible();
  });
});

test.describe('Contact Page - Auth-interrupted Submission', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page, '/contact');
  });

  test('shows auth modal for unauthenticated user', async ({ page }) => {
    await page.getByRole('button', { name: 'Submit Inquiry' }).click();
    await expect(page.getByText('Welcome Back')).toBeVisible();

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Get in Touch');
  });
});

test.describe('Contact Page - Returning User Flow', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isConfigured(USER), 'User E2E credentials not configured');
    await loginAsUser(page);

    await page.route('**/api/contact/my-requests', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{
            id: 1,
            status: 'new',
            created_at: '2026-01-01T00:00:00Z',
            question_preview: 'Existing inquiry question',
            questions: [{ question: 'Existing inquiry question' }],
          }],
          message: 'Requests retrieved',
        }),
      }),
    );

    await waitForAppReady(page, '/contact');
  });

  test('shows inquiry status list for returning user', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'My Inquiries' })).toBeVisible();

    const inquiryRow = page.getByRole('listitem').filter({ hasText: 'Existing inquiry question' });
    await expect(inquiryRow).toBeVisible();
    await expect(inquiryRow.getByText('New')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add question' })).toBeVisible();
  });

  test('adds question to existing inquiry', async ({ page }) => {
    await page.getByRole('button', { name: 'Add question' }).click();
    await expect(page.getByText('Add a Follow-up Question')).toBeVisible();

    await page.getByLabel('Question 1').fill('Follow-up question text');
    await page.getByRole('checkbox').click();

    await page.route('**/api/contact/1/question', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ data: {}, message: 'ok' }),
      }),
    );

    const modal = page.getByTestId('contact-modal');
    await modal.getByRole('button', { name: 'Add Question' }).click();

    await expect(page.getByText(/inquiry submitted/i)).toBeVisible();
  });
});
