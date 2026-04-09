const IS_CI = !!process.env.CI;
const DASHBOARD_READY_TIMEOUT = IS_CI ? 30_000 : 10_000;

export class AdminPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Wait for the admin dashboard to finish loading after navigation.
   * Firebase auth restoration + getMe API call can take several seconds
   * in CI, so the default 5s assertion timeout is often insufficient.
   *
   * Captures diagnostic info if the dashboard fails to appear.
   */
  async waitForDashboardReady() {
    const apiResponses = [];
    const listener = async (res) => {
      const url = res.url();
      if (url.includes('/api/') || url.includes('identitytoolkit') || url.includes('securetoken')) {
        const body = await res.text().catch(() => '<unreadable>');
        apiResponses.push({ url: url.slice(0, 120), status: res.status(), body: body.slice(0, 300) });
      }
    };
    this.page.on('response', listener);

    try {
      await this.requestsTab.waitFor({ state: 'visible', timeout: DASHBOARD_READY_TIMEOUT });
    } catch (err) {
      const currentUrl = this.page.url();
      const pageTitle = await this.page.title().catch(() => '<unknown>');
      const bodyText = await this.page.locator('body').innerText({ timeout: 3_000 }).catch(() => '<unreadable>');
      console.error(
        `[waitForDashboardReady] Admin dashboard did not render within ${DASHBOARD_READY_TIMEOUT}ms.\n` +
          `  Current URL: ${currentUrl}\n` +
          `  Page title: ${pageTitle}\n` +
          `  Body text (first 500 chars): ${bodyText.slice(0, 500)}\n` +
          `  API responses captured:\n${JSON.stringify(apiResponses, null, 2)}`,
      );
      throw err;
    } finally {
      this.page.removeListener('response', listener);
    }
  }

  get requestsTab() {
    return this.page.getByRole('tab', { name: 'Requests' });
  }

  get analyticsTab() {
    return this.page.getByRole('tab', { name: 'Analytics' });
  }

  get settingsTab() {
    return this.page.getByRole('tab', { name: 'Settings' });
  }

  get recomputeTopicsButton() {
    return this.page.getByRole('button', { name: 'Recompute Topics' });
  }

  get analyzingButton() {
    return this.page.getByRole('button', { name: 'Analyzing...' });
  }

  get exportCsvButton() {
    return this.page.getByRole('button', { name: 'Export CSV' });
  }

  get adminEmailInput() {
    return this.page.getByPlaceholder('Admin email');
  }

  get addAdminButton() {
    return this.page.getByRole('button', { name: 'Add Admin' });
  }

  get removeAdminButton() {
    return this.page.getByRole('button', { name: 'Remove Admin' });
  }

  get timelineDrawer() {
    return this.page.getByTestId('timeline-drawer');
  }

  get chatDrawer() {
    return this.page.getByTestId('chat-drawer');
  }

  get chatOnlyLeadsLink() {
    return this.page.getByRole('tab', { name: 'Chat-only Leads' });
  }

  get laneRow() {
    return this.page
      .locator('[role="button"]', { hasText: 'Inquiries:' })
      .first();
  }

  laneRowForUser(identifier) {
    return this.page
      .locator('[role="button"]', { hasText: identifier });
  }

  get topicRows() {
    return this.page.locator('table tbody tr');
  }

  get saveButton() {
    return this.page.getByRole('button', { name: 'Save' });
  }

  get deleteButton() {
    return this.page.getByRole('button', { name: 'Delete' });
  }

  get alert() {
    return this.page.getByRole('alert');
  }

  get statusSelect() {
    return this.page.getByLabel('Status');
  }

  get adminNotesInput() {
    return this.page.getByLabel('Admin Notes');
  }

  async navigateToAnalytics() {
    await this.page.waitForLoadState('networkidle');
    await this.analyticsTab.click({ timeout: 20000 });
  }

  async navigateToSettings() {
    await this.settingsTab.click();
  }

  async clickRecomputeTopics() {
    await this.recomputeTopicsButton.click();
  }

  async clickExportCsv() {
    await this.exportCsvButton.click();
  }

  async fillAdminEmail(email) {
    await this.adminEmailInput.fill(email);
  }

  async clickAddAdmin() {
    await this.addAdminButton.click();
  }

  async clickRemoveAdmin() {
    await this.removeAdminButton.click();
  }

  async openLane(identifier) {
    if (identifier) {
      await this.laneRowForUser(identifier).click();
    } else {
      await this.laneRow.click();
    }
  }

  async openChatOnlyLeads() {
    await this.chatOnlyLeadsLink.click();
  }

  timelineListItems() {
    return this.timelineDrawer.getByRole('listitem');
  }
}
