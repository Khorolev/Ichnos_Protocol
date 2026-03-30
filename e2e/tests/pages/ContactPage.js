export class ContactPage {
  constructor(page) {
    this.page = page;
  }

  get startChatButton() {
    return this.page.getByRole('button', { name: 'Start Chat' });
  }

  get submitInquiryButton() {
    return this.page.getByRole('button', { name: 'Submit Inquiry' });
  }

  get bookMeetingButton() {
    return this.page.getByRole('button', { name: 'Book a Meeting' });
  }

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

  get chatTitle() {
    return this.page.getByText('Chat with Ichnos AI');
  }

  get messageInput() {
    return this.page.getByPlaceholder('Type your message...');
  }

  get sendButton() {
    return this.page.getByRole('button', { name: 'Send' });
  }

  get addQuestionTitle() {
    return this.page.getByText('Add a Follow-up Question');
  }

  get myInquiriesHeading() {
    return this.page.getByRole('heading', { name: 'My Inquiries' });
  }

  async clickStartChat() {
    await this.startChatButton.click();
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
