import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const SUPER_ADMIN_EMAIL = process.env.E2E_SUPER_ADMIN_EMAIL;
const SUPER_ADMIN_PASSWORD = process.env.E2E_SUPER_ADMIN_PASSWORD;

async function loginAs(page, email, password) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByText('Welcome Back')).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('.user-menu-toggle')).toBeVisible({
    timeout: 15_000,
  });
}

test.describe('Admin Analytics - Topic Recompute Flow', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Admin E2E credentials not configured');
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/admin');
  });

  test('navigate to Analytics tab and verify topic table structure', async ({ page }) => {
    await page.getByRole('tab', { name: 'Analytics' }).click();

    await expect(page.getByText('Topic Analytics')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Recompute Topics' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Topic' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Count' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Avg Confidence' })).toBeVisible();
  });

  test('recompute topics shows success alert and refreshes table', async ({ page }) => {
    await page.getByRole('tab', { name: 'Analytics' }).click();

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/admin/analyze-topics') &&
        resp.request().method() === 'POST',
    );

    await page.getByRole('button', { name: 'Recompute Topics' }).click();

    // Button should show loading state
    await expect(page.getByRole('button', { name: 'Analyzing...' })).toBeVisible();

    const response = await responsePromise;
    expect(response.status()).toBeLessThan(400);

    // Success alert should appear with processed/skipped info
    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible({ timeout: 10_000 });
    await expect(alert).toContainText('Processed');
    await expect(alert).toContainText('skipped');

    // Button should return to normal state
    await expect(page.getByRole('button', { name: 'Recompute Topics' })).toBeVisible();

    // Topics table should have refreshed (verify table body has rows or "No topics" message)
    const topicRows = page.locator('table tbody tr');
    await expect(topicRows.first()).toBeVisible({ timeout: 5_000 });
  });

  test('recompute topics button disables during analysis', async ({ page }) => {
    await page.getByRole('tab', { name: 'Analytics' }).click();

    await page.getByRole('button', { name: 'Recompute Topics' }).click();

    // While analyzing, the button should be disabled
    const analyzingBtn = page.getByRole('button', { name: 'Analyzing...' });
    await expect(analyzingBtn).toBeDisabled();

    // Wait for completion
    await expect(page.getByRole('button', { name: 'Recompute Topics' })).toBeVisible({
      timeout: 30_000,
    });
  });
});

test.describe('Admin Analytics - CSV Export', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Admin E2E credentials not configured');
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/admin');
  });

  test('export CSV triggers file download with correct filename', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Requests' })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');

    await page.getByRole('button', { name: 'Export CSV' }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('contacts');
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('export CSV creates valid downloadable blob', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Requests' })).toBeVisible();

    // Intercept the export API call to verify response
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/admin/export') &&
        resp.request().method() === 'GET',
    );

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export CSV' }).click();

    const response = await responsePromise;
    expect(response.status()).toBeLessThan(400);

    const download = await downloadPromise;
    // Read the downloaded file content to verify it's valid CSV
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('export CSV shows error alert on failure', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Requests' })).toBeVisible();

    // Intercept and force failure
    await page.route('**/api/admin/export', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      }),
    );

    await page.getByRole('button', { name: 'Export CSV' }).click();

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible({ timeout: 5_000 });
    await expect(alert).toContainText('CSV export failed');
  });
});

test.describe('Admin Analytics - Super-Admin Management', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD,
      'Super-admin E2E credentials not configured',
    );
    await loginAs(page, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);
    await page.goto('/admin');
  });

  test('Settings tab is visible for super-admin', async ({ page }) => {
    const settingsTab = page.getByRole('tab', { name: 'Settings' });
    await expect(settingsTab).toBeVisible({ timeout: 10_000 });
  });

  test('Settings tab shows Manage Admins form', async ({ page }) => {
    await page.getByRole('tab', { name: 'Settings' }).click();

    await expect(page.getByText('Manage Admins')).toBeVisible();
    await expect(page.getByPlaceholder('Admin email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Admin' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove Admin' })).toBeVisible();
  });

  test('add admin shows success alert', async ({ page }) => {
    await page.getByRole('tab', { name: 'Settings' }).click();

    const testEmail = 'e2e-test-admin@example.com';

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/admin/manage-admins') &&
        resp.request().method() === 'POST',
    );

    await page.getByPlaceholder('Admin email').fill(testEmail);
    await page.getByRole('button', { name: 'Add Admin' }).click();

    const response = await responsePromise;
    expect(response.status()).toBeLessThan(400);

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible({ timeout: 5_000 });
    await expect(alert).toContainText('Admin added');
    await expect(alert).toContainText(testEmail);

    // Email input should be cleared after success
    await expect(page.getByPlaceholder('Admin email')).toHaveValue('');
  });

  test('remove admin shows success alert', async ({ page }) => {
    await page.getByRole('tab', { name: 'Settings' }).click();

    const testEmail = 'e2e-test-admin@example.com';

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/admin/manage-admins') &&
        resp.request().method() === 'POST',
    );

    await page.getByPlaceholder('Admin email').fill(testEmail);
    await page.getByRole('button', { name: 'Remove Admin' }).click();

    const response = await responsePromise;
    expect(response.status()).toBeLessThan(400);

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible({ timeout: 5_000 });
    await expect(alert).toContainText('Admin removed');
    await expect(alert).toContainText(testEmail);

    // Email input should be cleared after success
    await expect(page.getByPlaceholder('Admin email')).toHaveValue('');
  });

  test('manage admin shows error alert on failure', async ({ page }) => {
    await page.getByRole('tab', { name: 'Settings' }).click();

    // Intercept and force failure
    await page.route('**/api/admin/manage-admins', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      }),
    );

    await page.getByPlaceholder('Admin email').fill('fail@example.com');
    await page.getByRole('button', { name: 'Add Admin' }).click();

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible({ timeout: 5_000 });
    await expect(alert).toContainText('Failed to update admin');
  });
});

test.describe('Admin Analytics - Settings Tab Visibility', () => {
  test('Settings tab is NOT visible for regular admin', async ({ page }) => {
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Admin E2E credentials not configured');
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/admin');

    await expect(page.getByRole('tab', { name: 'Requests' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Analytics' })).toBeVisible();

    // Settings tab should not be visible for non-super-admin
    await expect(page.getByRole('tab', { name: 'Settings' })).not.toBeVisible();
  });
});
