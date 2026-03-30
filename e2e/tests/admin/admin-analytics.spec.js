import { test, expect } from '../fixtures/auth.js';
import { ADMIN, USER, SUPER_ADMIN, MANAGE_ADMIN_TARGET, isConfigured } from '../helpers/credentials.js';
import { AdminPage } from '../pages/AdminPage.js';

function assertManageAdminTargetDistinct() {
  if (!isConfigured(MANAGE_ADMIN_TARGET)) return;
  const target = MANAGE_ADMIN_TARGET.email.toLowerCase();
  const roleEmails = [
    ['USER', USER.email],
    ['ADMIN', ADMIN.email],
    ['SUPER_ADMIN', SUPER_ADMIN.email],
  ];
  for (const [role, email] of roleEmails) {
    if (email && target === email.toLowerCase()) {
      throw new Error(
        `E2E_MANAGE_ADMIN_TARGET_EMAIL must not equal E2E_${role}_EMAIL (${email}). ` +
          'Destructive manage-admin tests would mutate a shared account.',
      );
    }
  }
}

assertManageAdminTargetDistinct();

test.describe('Admin Analytics - Topic Recompute Flow', { tag: ['@admin'] }, () => {
  test.beforeEach(() => {
    test.skip(!isConfigured(ADMIN), 'Admin E2E credentials not configured');
  });

  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/admin');
  });

  test('navigate to Analytics tab and verify topic table structure', async ({
    adminPage,
  }) => {
    const admin = new AdminPage(adminPage);
    await admin.navigateToAnalytics();

    await expect(adminPage.getByText('Topic Analytics')).toBeVisible();
    await expect(admin.recomputeTopicsButton).toBeVisible();
    await expect(
      adminPage.getByRole('columnheader', { name: 'Topic' }),
    ).toBeVisible();
    await expect(
      adminPage.getByRole('columnheader', { name: 'Count' }),
    ).toBeVisible();
    await expect(
      adminPage.getByRole('columnheader', { name: 'Avg Confidence' }),
    ).toBeVisible();
  });

  test('recompute topics shows success alert and refreshes table', { tag: ['@slow'] }, async ({
    adminPage,
  }) => {
    const admin = new AdminPage(adminPage);
    await admin.navigateToAnalytics();

    const responsePromise = adminPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/admin/analyze-topics') &&
        resp.request().method() === 'POST',
      { timeout: 30_000 },
    );

    await admin.clickRecomputeTopics();

    await expect(admin.analyzingButton).toBeVisible();

    const response = await responsePromise;
    expect(response.status()).toBeLessThan(400);

    await expect(admin.alert).toBeVisible({ timeout: 10_000 });
    await expect(admin.alert).toContainText('Processed');
    await expect(admin.alert).toContainText('skipped');

    await expect(admin.recomputeTopicsButton).toBeVisible();

    const noTopicsMsg = adminPage.getByText('No topics found');

    const hasRows = (await admin.topicRows.count()) > 0;
    const hasEmptyMsg = (await noTopicsMsg.count()) > 0;

    expect(hasRows || hasEmptyMsg).toBeTruthy();
  });

  test('recompute topics button disables during analysis', { tag: ['@slow'] }, async ({ adminPage }) => {
    const admin = new AdminPage(adminPage);
    await admin.navigateToAnalytics();

    await admin.clickRecomputeTopics();

    await expect(admin.analyzingButton).toBeDisabled();

    await expect(admin.recomputeTopicsButton).toBeVisible({
      timeout: 30_000,
    });
  });

  test('recompute topics shows failure alert on API error and recovers button state', async ({
    adminPage,
  }) => {
    const admin = new AdminPage(adminPage);
    await admin.navigateToAnalytics();

    await adminPage.route('**/api/admin/analyze-topics', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      }),
    );

    await admin.clickRecomputeTopics();

    await expect(admin.alert).toBeVisible({ timeout: 10_000 });
    await expect(admin.alert).toContainText('Topic analysis failed');

    await expect(admin.recomputeTopicsButton).toBeVisible();
    await expect(admin.recomputeTopicsButton).toBeEnabled();
  });
});

test.describe('Admin Analytics - CSV Export', { tag: ['@admin'] }, () => {
  test.beforeEach(() => {
    test.skip(!isConfigured(ADMIN), 'Admin E2E credentials not configured');
  });

  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/admin');
  });

  test('export CSV triggers file download with correct filename', async ({
    adminPage,
  }) => {
    const admin = new AdminPage(adminPage);
    await expect(admin.requestsTab).toBeVisible();

    const downloadPromise = adminPage.waitForEvent('download');

    await admin.clickExportCsv();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('contacts');
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('export CSV creates valid downloadable blob', async ({ adminPage }) => {
    const admin = new AdminPage(adminPage);
    await expect(admin.requestsTab).toBeVisible();

    const responsePromise = adminPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/admin/export') &&
        resp.request().method() === 'GET',
      { timeout: 15_000 },
    );

    const downloadPromise = adminPage.waitForEvent('download');
    await admin.clickExportCsv();

    const response = await responsePromise;
    expect(response.status()).toBeLessThan(400);

    const download = await downloadPromise;
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('export CSV shows error alert on failure', async ({ adminPage }) => {
    const admin = new AdminPage(adminPage);
    await expect(admin.requestsTab).toBeVisible();

    await adminPage.route('**/api/admin/export', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      }),
    );

    await admin.clickExportCsv();

    await expect(admin.alert).toBeVisible({ timeout: 5_000 });
    await expect(admin.alert).toContainText('CSV export failed');
  });
});

test.describe('Admin Analytics - Super-Admin Management', { tag: ['@admin'] }, () => {
  // Serialize destructive tests to prevent cross-worker collisions on the
  // shared manage-admin target (E2E_MANAGE_ADMIN_TARGET_EMAIL). With
  // fullyParallel + E2E_WORKERS=2, parallel execution could race Firebase
  // custom-claims updates for the same account.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(() => {
    test.skip(
      !isConfigured(SUPER_ADMIN),
      'Super-admin E2E credentials not configured',
    );
  });

  test.beforeEach(async ({ superAdminPage }) => {
    await superAdminPage.goto('/admin');
  });

  test('Settings tab is visible for super-admin', async ({ superAdminPage }) => {
    const admin = new AdminPage(superAdminPage);
    await expect(admin.settingsTab).toBeVisible({ timeout: 10_000 });
  });

  test('Settings tab shows Manage Admins form', async ({ superAdminPage }) => {
    const admin = new AdminPage(superAdminPage);
    await admin.navigateToSettings();

    await expect(superAdminPage.getByText('Manage Admins')).toBeVisible();
    await expect(admin.adminEmailInput).toBeVisible();
    await expect(admin.addAdminButton).toBeVisible();
    await expect(admin.removeAdminButton).toBeVisible();
  });

  test('add admin shows success alert', { tag: ['@destructive'] }, async ({ superAdminPage }) => {
    test.skip(
      !isConfigured(MANAGE_ADMIN_TARGET),
      'Manage-admin target E2E credentials not configured',
    );

    const admin = new AdminPage(superAdminPage);
    await admin.navigateToSettings();

    // Use the dedicated manage-admin target identity. This account exists
    // solely for add/remove admin claim mutations, avoiding side effects
    // on the shared E2E_USER used by other test suites.
    const targetEmail = MANAGE_ADMIN_TARGET.email;

    const responsePromise = superAdminPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/admin/manage-admins') &&
        resp.request().method() === 'POST',
      { timeout: 15_000 },
    );

    await admin.fillAdminEmail(targetEmail);
    await admin.clickAddAdmin();

    const response = await responsePromise;
    expect(response.status()).toBeLessThan(400);

    await expect(admin.alert).toBeVisible({ timeout: 5_000 });
    await expect(admin.alert).toContainText('Admin added');
    await expect(admin.alert).toContainText(targetEmail);

    await expect(admin.adminEmailInput).toHaveValue('');
  });

  test('remove admin shows success alert', { tag: ['@destructive'] }, async ({ superAdminPage }) => {
    test.skip(
      !isConfigured(MANAGE_ADMIN_TARGET),
      'Manage-admin target E2E credentials not configured',
    );

    const admin = new AdminPage(superAdminPage);
    await admin.navigateToSettings();

    // Use the same dedicated manage-admin target. The serial mode
    // guarantees this runs after the "add admin" test above, so the
    // target will have the admin claim set from the previous test.
    const targetEmail = MANAGE_ADMIN_TARGET.email;

    const responsePromise = superAdminPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/admin/manage-admins') &&
        resp.request().method() === 'POST',
      { timeout: 15_000 },
    );

    await admin.fillAdminEmail(targetEmail);
    await admin.clickRemoveAdmin();

    const response = await responsePromise;
    expect(response.status()).toBeLessThan(400);

    await expect(admin.alert).toBeVisible({ timeout: 5_000 });
    await expect(admin.alert).toContainText('Admin removed');
    await expect(admin.alert).toContainText(targetEmail);

    await expect(admin.adminEmailInput).toHaveValue('');
  });

  test('manage admin shows error alert on failure', async ({ superAdminPage }) => {
    const admin = new AdminPage(superAdminPage);
    await admin.navigateToSettings();

    await superAdminPage.route('**/api/admin/manage-admins', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      }),
    );

    await admin.fillAdminEmail('fail@example.com');
    await admin.clickAddAdmin();

    await expect(admin.alert).toBeVisible({ timeout: 5_000 });
    await expect(admin.alert).toContainText('Failed to update admin');
  });
});

test.describe('Admin Analytics - Settings Tab Visibility', { tag: ['@admin'] }, () => {
  test.beforeEach(() => {
    test.skip(!isConfigured(ADMIN), 'Admin E2E credentials not configured');
  });

  test('Settings tab is NOT visible for regular admin', async ({ adminPage }) => {
    await adminPage.goto('/admin');

    const admin = new AdminPage(adminPage);
    await expect(admin.requestsTab).toBeVisible();
    await expect(admin.analyticsTab).toBeVisible();

    await expect(admin.settingsTab).not.toBeVisible();
  });
});
