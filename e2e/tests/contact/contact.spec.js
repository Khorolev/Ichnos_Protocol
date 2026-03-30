import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/app.js';
import { loginAsUser } from '../helpers/auth.js';
import { USER, isConfigured } from '../helpers/credentials.js';
import { ContactPage } from '../pages/ContactPage.js';
import { AuthPage } from '../pages/AuthPage.js';

test.describe('Contact Page - Public Access', { tag: ['@contact'] }, () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page, '/contact');
  });

  test('displays all contact options', async ({ page }) => {
    const contact = new ContactPage(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Get in Touch');
    await expect(contact.startChatButton).toBeVisible();
    await expect(contact.submitInquiryButton).toBeVisible();
    await expect(contact.bookMeetingButton).toBeVisible();
  });
});

test.describe('Contact Page - Submit Inquiry', { tag: ['@contact'] }, () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isConfigured(USER), 'User E2E credentials not configured');
    await loginAsUser(page);
    await waitForAppReady(page, '/contact');
  });

  test('submit an inquiry successfully', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.clickSubmitInquiry();
    await expect(page.getByText('Submit an Inquiry')).toBeVisible();

    await contact.fillQuestion('Test inquiry from E2E');
    await contact.checkPrivacy();

    await page.route('**/api/contact/submit', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ data: {}, message: 'ok' }),
      }),
    );

    await contact.submitModalInquiry();

    await expect(page.getByText(/inquiry submitted/i)).toBeVisible();
    await expect(contact.bookMeetingButton).toBeVisible();
  });
});

test.describe('Contact Page - Auth-interrupted Submission', { tag: ['@contact'] }, () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page, '/contact');
  });

  test('shows auth modal for unauthenticated user', async ({ page }) => {
    const contact = new ContactPage(page);
    const auth = new AuthPage(page);

    await contact.clickSubmitInquiry();
    await expect(contact.contactModal).toBeVisible();

    await contact.contactModal.getByLabel('Question 1').fill('Test question');
    await contact.contactModal.getByRole('checkbox').click();
    await contact.contactModal.getByRole('button', { name: 'Submit Inquiry' }).click();

    await expect(auth.authModal).toBeVisible();
    await expect(
      auth.authModal.getByLabel('Email'),
    ).toBeVisible();

    await auth.authModal.getByRole('button', { name: 'Close' }).click();
    await expect(auth.authModal).not.toBeVisible();
  });
});

test.describe('Contact Page - Returning User Flow', { tag: ['@contact'] }, () => {
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
    const contact = new ContactPage(page);
    await expect(contact.myInquiriesHeading).toBeVisible();

    const inquiryRow = page.getByRole('listitem').filter({ hasText: 'Existing inquiry question' });
    await expect(inquiryRow).toBeVisible();
    await expect(inquiryRow.getByText('New')).toBeVisible();
    await expect(contact.addQuestionButton).toBeVisible();
  });

  test('adds question to existing inquiry', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.clickAddQuestion();
    await expect(contact.addQuestionTitle).toBeVisible();

    await contact.fillQuestion('Follow-up question text');
    await contact.checkPrivacy();

    await page.route('**/api/contact/1/question', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ data: {}, message: 'ok' }),
      }),
    );

    await contact.modalAddQuestion();

    await expect(page.getByText(/inquiry submitted/i)).toBeVisible();
  });
});
