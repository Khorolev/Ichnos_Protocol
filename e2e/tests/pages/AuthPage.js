export class AuthPage {
  constructor(page) {
    this.page = page;
  }

  get navbarLoginButton() {
    return this.page.getByTestId('navbar').getByRole('button', { name: 'Login' });
  }

  get authModal() {
    return this.page.getByTestId('auth-modal');
  }

  get welcomeBackText() {
    return this.page.getByText('Welcome Back');
  }

  get createAccountText() {
    return this.page.getByText('Create Account');
  }

  get emailInput() {
    return this.page.getByLabel('Email');
  }

  get passwordInput() {
    return this.page.getByLabel('Password');
  }

  get submitButton() {
    return this.page.locator('button[type="submit"]');
  }

  get userMenuToggle() {
    return this.page.getByTestId('user-menu-toggle');
  }

  get signUpTab() {
    return this.page.getByText('Sign Up');
  }

  get authSubmitSpinner() {
    return this.page.getByTestId('auth-submit-spinner');
  }

  get logoutText() {
    return this.page.getByText('Logout');
  }

  get nameInput() {
    return this.page.getByLabel('Name', { exact: true });
  }

  get surnameInput() {
    return this.page.getByLabel('Surname');
  }

  get companyInput() {
    return this.page.getByLabel('Company (optional)');
  }

  get phoneInput() {
    return this.page.getByLabel('Phone (optional)');
  }

  get linkedinInput() {
    return this.page.getByLabel('LinkedIn (optional)');
  }

  get alert() {
    return this.page.getByTestId('auth-modal').getByRole('alert');
  }

  get privacyNotice() {
    return this.page.getByText(/by signing up you agree/i);
  }

  get modalCloseButton() {
    return this.page.getByTestId('auth-modal').getByRole('button', { name: 'Close' });
  }

  get modalLoginButton() {
    return this.page.getByTestId('auth-modal').getByRole('button', { name: 'Login' });
  }

  async openLoginModal() {
    await this.navbarLoginButton.click();
  }

  async openSignupTab() {
    await this.signUpTab.click();
  }

  async switchToLoginTab() {
    await this.modalLoginButton.click();
  }

  async fillLoginForm(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async fillSignupForm({ name, surname, email, password, company, phone, linkedin }) {
    await this.nameInput.fill(name);
    await this.surnameInput.fill(surname);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    if (company) await this.companyInput.fill(company);
    if (phone) await this.phoneInput.fill(phone);
    if (linkedin) await this.linkedinInput.fill(linkedin);
  }

  async submitForm() {
    await this.submitButton.click();
  }

  async closeModal() {
    await this.modalCloseButton.click();
  }

  async openUserMenu() {
    await this.userMenuToggle.click();
  }

  async clickLogout() {
    await this.logoutText.click();
  }
}
