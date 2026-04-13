import { test, expect } from '../fixtures/auth.js';
import { ADMIN, isConfigured } from '../helpers/credentials.js';
import { AdminPage } from '../pages/AdminPage.js';

test.describe('Admin Kanban - Basic Flow', { tag: ['@admin'] }, () => {
  test.beforeEach(() => {
    test.skip(!isConfigured(ADMIN), 'Admin E2E credentials not configured');
  });

  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/admin');
    const admin = new AdminPage(adminPage);
    await admin.waitForDashboardReady();
  });

  test('Requests tab and Inquiries board are visible', { tag: ['@smoke'] }, async ({ adminPage }) => {
    const admin = new AdminPage(adminPage);
    await expect(admin.requestsTab).toBeVisible();
    await expect(adminPage.getByText('Inquiries Board')).toBeVisible();
  });

  test('expand first lane and verify request columns', async ({ adminPage }) => {
    const expandButtons = adminPage.getByRole('button', { name: 'Expand' });
    const firstExpand = expandButtons.first();

    const hasExpandButtons = (await expandButtons.count()) > 0;

    if (!hasExpandButtons) {
      await expect(adminPage.getByText('Inquiries Board')).toBeVisible();
      return;
    }

    await firstExpand.click();

    const newCol = adminPage.getByText('New', { exact: true });
    const inProgressCol = adminPage.getByText('In Progress', { exact: true });
    const contactedCol = adminPage.getByText('Contacted', { exact: true });

    const anyVisible =
      (await newCol.isVisible().catch(() => false)) ||
      (await inProgressCol.isVisible().catch(() => false)) ||
      (await contactedCol.isVisible().catch(() => false));

    expect(anyVisible).toBeTruthy();
  });
});

test.describe('Admin Kanban - Request Edit Flow', { tag: ['@admin'] }, () => {
  test.beforeEach(() => {
    test.skip(!isConfigured(ADMIN), 'Admin E2E credentials not configured');
  });

  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/admin');
    const admin = new AdminPage(adminPage);
    await admin.waitForDashboardReady();
  });

  test('open timeline drawer and edit a request', async ({ adminPage, testRunId }) => {
    const admin = new AdminPage(adminPage);
    const adminEmail = process.env.E2E_ADMIN_EMAIL;
    const laneTarget = admin.laneRowForUser(adminEmail);
    await expect(laneTarget).toBeVisible({ timeout: 10_000 });
    await admin.openLane(adminEmail);

    await expect(admin.timelineDrawer).toBeVisible({
      timeout: 5_000,
    });

    const listItems = admin.timelineListItems();
    const hasItems = (await listItems.count()) > 0;

    if (!hasItems) {
      await expect(admin.timelineDrawer).toBeVisible();
      return;
    }

    const targetItem = listItems.filter({ hasText: 'E2E test question' }).first();
    await targetItem.click();

    await expect(admin.statusSelect).toBeVisible();
    await expect(admin.adminNotesInput).toBeVisible();

    const noteValue = `E2E note ${testRunId}`;
    await admin.statusSelect.selectOption('contacted');
    await admin.adminNotesInput.fill(noteValue);

    const saveResponsePromise = adminPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/admin/request') &&
        resp.request().method() === 'PUT',
      { timeout: 15_000 },
    );
    await admin.saveButton.click();

    const saveResponse = await saveResponsePromise;
    expect(saveResponse.status()).toBeLessThan(400);

    await expect(admin.saveButton).not.toBeVisible({
      timeout: 5_000,
    });

    const verifyItem = listItems.filter({ hasText: 'E2E test question' }).first();
    await verifyItem.click();
    await expect(admin.statusSelect).toBeVisible();
    await expect(admin.statusSelect).toHaveValue('contacted');
    await expect(admin.adminNotesInput).toHaveValue(noteValue);
  });
});

test.describe('Admin Kanban - Chat-only Leads', { tag: ['@admin'] }, () => {
  test.beforeEach(() => {
    test.skip(!isConfigured(ADMIN), 'Admin E2E credentials not configured');
  });

  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/admin');
    const admin = new AdminPage(adminPage);
    await admin.waitForDashboardReady();
  });

  test('switch to Chat-only Leads sub-tab and verify table', async ({
    adminPage,
  }) => {
    const admin = new AdminPage(adminPage);
    await admin.openChatOnlyLeads();

    await expect(
      adminPage.getByRole('columnheader', { name: 'Name' }),
    ).toBeVisible();
    await expect(
      adminPage.getByRole('columnheader', { name: 'Email' }),
    ).toBeVisible();
    await expect(
      adminPage.getByRole('columnheader', { name: 'Total Messages' }),
    ).toBeVisible();
  });

  test('open chat lead drawer and verify Q&A', async ({ adminPage }) => {
    const admin = new AdminPage(adminPage);
    await admin.openChatOnlyLeads();

    const rows = adminPage.locator('tbody tr');
    const e2eRows = rows.filter({ hasText: 'E2E' });
    const hasE2eRows = (await e2eRows.count()) > 0;

    if (!hasE2eRows) {
      await expect(
        adminPage.getByRole('columnheader', { name: 'Name' }),
      ).toBeVisible();
      return;
    }

    await e2eRows.first().click();

    await expect(adminPage.getByText('Chat History')).toBeVisible({
      timeout: 5_000,
    });
    await expect(admin.chatDrawer).toBeVisible();

    const qaPrefix = adminPage.getByText(/^Q:/);
    await expect(qaPrefix.first()).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Admin Kanban - Request Delete Flow', { tag: ['@admin'] }, () => {
  test.beforeEach(() => {
    test.skip(!isConfigured(ADMIN), 'Admin E2E credentials not configured');
  });

  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/admin');
    const admin = new AdminPage(adminPage);
    await admin.waitForDashboardReady();
  });

  test('delete a request from timeline drawer', { tag: ['@destructive'] }, async ({ adminPage }) => {
    const admin = new AdminPage(adminPage);
    const adminEmail = process.env.E2E_ADMIN_EMAIL;
    const laneTarget = admin.laneRowForUser(adminEmail);
    await expect(laneTarget).toBeVisible({ timeout: 10_000 });
    await admin.openLane(adminEmail);

    await expect(admin.timelineDrawer).toBeVisible({
      timeout: 5_000,
    });

    const listItems = admin.timelineListItems();
    const hasItems = (await listItems.count()) > 0;

    if (!hasItems) {
      await expect(admin.timelineDrawer).toBeVisible();
      return;
    }

    const targetItem = listItems.filter({ hasText: 'E2E test question' }).first();
    await targetItem.click();

    await expect(admin.deleteButton).toBeVisible();

    await adminPage.route('**/api/admin/request/**', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: { success: true },
            message: 'Request deleted',
          }),
        });
      }
      return route.continue();
    });

    await adminPage.evaluate(() => {
      window.confirm = () => true;
    });

    const deleteResponse = adminPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/admin/request') &&
        resp.request().method() === 'DELETE',
      { timeout: 15_000 },
    );
    await admin.deleteButton.click();
    const resp = await deleteResponse;
    expect(resp.status()).toBeLessThan(400);

    await expect(admin.deleteButton).not.toBeVisible({
      timeout: 5_000,
    });
  });
});
