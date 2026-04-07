import { expect } from '@playwright/test';
import { waitForAppReady, TIMEOUTS } from './app.js';
import { ADMIN, USER, SUPER_ADMIN } from './credentials.js';
import { AuthPage } from '../pages/AuthPage.js';

export async function loginAs(page, email, password) {
  const auth = new AuthPage(page);
  await waitForAppReady(page, '/');
  await auth.openLoginModal();
  await expect(auth.welcomeBackText).toBeVisible();
  await auth.fillLoginForm(email, password);
  await auth.submitForm();
  await expect(auth.userMenuToggle).toBeVisible({
    timeout: TIMEOUTS.authVerify,
  });
}

export async function loginAsAdmin(page) {
  await loginAs(page, ADMIN.email, ADMIN.password);
}

export async function loginAsUser(page) {
  await loginAs(page, USER.email, USER.password);
}

export async function loginAsSuperAdmin(page) {
  await loginAs(page, SUPER_ADMIN.email, SUPER_ADMIN.password);
}
