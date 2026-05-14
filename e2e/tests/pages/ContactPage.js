export class ContactPage {
  constructor(page) {
    this.page = page;
  }

  // ─── Inline ChatPanel (rendered directly on /contact via ContactSection) ───
  // The chat is always visible on page load; there is no "Start Chat" button
  // in the post-refactor UI. Sending a message while unauthenticated triggers
  // the auth modal.

  get chatPanel() {
    return this.page.getByTestId('chat-panel');
  }

  get messageInput() {
    return this.page.getByPlaceholder('Type your message…');
  }

  get sendButton() {
    return this.page.getByRole('button', { name: 'Send message' });
  }

  // ─── Page-level CTAs (open the contact-form / Calendly modals) ───

  get submitInquiryButton() {
    return this.page.getByRole('button', { name: 'Submit a detailed inquiry' });
  }

  get bookMeetingButton() {
    return this.page.getByRole('button', { name: 'Schedule a call' });
  }

  // ─── Contact-inquiry modal (opened via "Submit a detailed inquiry") ───
  // Modal-internal labels remain unchanged from the original implementation.

  get contactModal() {
    return this.page.getByTestId('contact-modal');
  }

  get questionInput() {
    return this.page.getByLabel('Question 1');
  }

  get privacyCheckbox() {
    return this.page.getByRole('checkbox');
  }

  get addQuestionButton() {
    return this.page.getByRole('button', { name: 'Add question' });
  }

  get addQuestionTitle() {
    return this.page.getByText('Add a Follow-up Question');
  }

  get myInquiriesHeading() {
    return this.page.getByRole('heading', { name: 'My Inquiries' });
  }

  async clickSubmitInquiry() {
    await this.submitInquiryButton.click();
  }

  async fillQuestion(text) {
    await this.questionInput.fill(text);
  }

  async checkPrivacy() {
    await this.privacyCheckbox.click();
  }

  async submitModalInquiry() {
    await this.contactModal.getByRole('button', { name: 'Submit Inquiry' }).click();
  }

  async clickAddQuestion() {
    await this.addQuestionButton.click();
  }

  async sendChatMessage(text) {
    await this.messageInput.fill(text);
    await this.sendButton.click();
  }

  async modalAddQuestion() {
    await this.contactModal.getByRole('button', { name: 'Add Question' }).click();
  }
}
