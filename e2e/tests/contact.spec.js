import { test, expect } from '@playwright/test';

const USER_EMAIL = process.env.E2E_USER_EMAIL;
const USER_PASSWORD = process.env.E2E_USER_PASSWORD;

async function loginAsUser(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByText('Welcome Back')).toBeVisible();
  await page.getByLabel('Email').fill(USER_EMAIL);
  await page.getByLabel('Password').fill(USER_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('.user-menu-toggle')).toBeVisible({ timeout: 15_000 });
}

test.describe('Contact Page - Public Access', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
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
    test.skip(!USER_EMAIL || !USER_PASSWORD, 'User E2E credentials not configured');
    await loginAsUser(page);
    await page.goto('/contact');
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

    const modal = page.locator('.modal.show');
    await modal.getByRole('button', { name: 'Submit Inquiry' }).click();

    await expect(page.getByText(/inquiry submitted/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Book a Meeting' })).toBeVisible();
  });
});

test.describe('Contact Page - Auth-interrupted Submission', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
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
    test.skip(!USER_EMAIL || !USER_PASSWORD, 'User E2E credentials not configured');
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

    await page.goto('/contact');
  });

  test('shows inquiry status list for returning user', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'My Inquiries' })).toBeVisible();

    const inquiryRow = page.locator('.list-group-item', { hasText: 'Existing inquiry question' });
    await expect(inquiryRow).toBeVisible();
    await expect(inquiryRow.locator('.badge')).toHaveText('New');
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

    const modal = page.locator('.modal.show');
    await modal.getByRole('button', { name: 'Add Question' }).click();

    await expect(page.getByText(/inquiry submitted/i)).toBeVisible();
  });
});
