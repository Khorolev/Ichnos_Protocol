import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

async function loginAsAdmin(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByText('Welcome Back')).toBeVisible();
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('.user-menu-toggle')).toBeVisible({
    timeout: 15_000,
  });
}

test.describe('Admin Kanban - Basic Flow', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Admin E2E credentials not configured');
    await loginAsAdmin(page);
    await page.goto('/admin');
  });

  test('Requests tab and Inquiries board are visible', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Requests' })).toBeVisible();
    await expect(page.getByText('Inquiries Board')).toBeVisible();
  });

  test('expand first lane and verify request columns', async ({ page }) => {
    const expandButtons = page.getByRole('button', { name: 'Expand' });
    await expect(expandButtons.first()).toBeVisible({ timeout: 10_000 });
    expect(await expandButtons.count()).toBeGreaterThan(0);

    await expandButtons.first().click();

    const newCol = page.getByText('new');
    const inProgressCol = page.getByText('in progress');
    const contactedCol = page.getByText('contacted');

    const anyVisible =
      (await newCol.isVisible().catch(() => false)) ||
      (await inProgressCol.isVisible().catch(() => false)) ||
      (await contactedCol.isVisible().catch(() => false));

    expect(anyVisible).toBeTruthy();
  });
});

test.describe('Admin Kanban - Request Edit Flow', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Admin E2E credentials not configured');
    await loginAsAdmin(page);
    await page.goto('/admin');
  });

  test('open timeline drawer and edit a request', async ({ page }) => {
    const laneRow = page.locator('[role="button"]', { hasText: 'Inquiries:' }).first();
    await expect(laneRow).toBeVisible({ timeout: 10_000 });
    await laneRow.click();

    await expect(page.locator('.offcanvas.show')).toBeVisible({
      timeout: 5_000,
    });

    const listItems = page.locator('.list-group-item');
    expect(await listItems.count()).toBeGreaterThan(0);

    await listItems.first().click();

    await expect(page.getByLabel('Status')).toBeVisible();
    await expect(page.getByLabel('Admin Notes')).toBeVisible();

    await page.getByLabel('Status').selectOption('contacted');
    await page.getByLabel('Admin Notes').fill('E2E test note');

    const saveResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/admin/request') && resp.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: 'Save' }).click();

    const saveResponse = await saveResponsePromise;
    expect(saveResponse.status()).toBeLessThan(400);

    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible({
      timeout: 5_000,
    });

    await listItems.first().click();
    await expect(page.getByLabel('Status')).toBeVisible();
    await expect(page.getByLabel('Status')).toHaveValue('contacted');
    await expect(page.getByLabel('Admin Notes')).toHaveValue('E2E test note');
  });
});

test.describe('Admin Kanban - Chat-only Leads', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Admin E2E credentials not configured');
    await loginAsAdmin(page);
    await page.goto('/admin');
  });

  test('switch to Chat-only Leads sub-tab and verify table', async ({
    page,
  }) => {
    await page.getByRole('link', { name: 'Chat-only Leads' }).click();

    await expect(
      page.getByRole('columnheader', { name: 'Name' }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Email' }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Total Messages' }),
    ).toBeVisible();
  });

  test('open chat lead drawer and verify Q&A', async ({ page }) => {
    await page.getByRole('link', { name: 'Chat-only Leads' }).click();

    const rows = page.locator('tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);

    await rows.first().click();

    await expect(page.getByText('Chat History')).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.locator('.offcanvas.show')).toBeVisible();

    const qaPrefix = page.getByText(/^Q:/);
    await expect(qaPrefix.first()).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Admin Kanban - Request Delete Flow', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Admin E2E credentials not configured');
    await loginAsAdmin(page);
    await page.goto('/admin');
  });

  test('delete a request from timeline drawer', async ({ page }) => {
    const laneRow = page.locator('[role="button"]', { hasText: 'Inquiries:' }).first();
    await expect(laneRow).toBeVisible({ timeout: 10_000 });
    await laneRow.click();

    await expect(page.locator('.offcanvas.show')).toBeVisible({ timeout: 5_000 });

    const listItems = page.locator('.list-group-item');
    expect(await listItems.count()).toBeGreaterThan(0);
    await listItems.first().click();

    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();

    await page.route('**/api/admin/request/**', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { success: true }, message: 'Request deleted' }),
        });
      }
      return route.continue();
    });

    await page.evaluate(() => { window.confirm = () => true; });

    const deleteResponse = page.waitForResponse(
      (resp) => resp.url().includes('/api/admin/request') && resp.request().method() === 'DELETE',
    );
    await page.getByRole('button', { name: 'Delete' }).click();
    const resp = await deleteResponse;
    expect(resp.status()).toBeLessThan(400);

    await expect(page.getByRole('button', { name: 'Delete' })).not.toBeVisible({ timeout: 5_000 });
  });
});
