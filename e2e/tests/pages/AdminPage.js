export class AdminPage {
  constructor(page) {
    this.page = page;
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
    return this.page.getByRole('link', { name: 'Chat-only Leads' });
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
    await this.analyticsTab.click();
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
