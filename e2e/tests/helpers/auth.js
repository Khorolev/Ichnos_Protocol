import { expect } from '@playwright/test';
import { waitForAppReady, TIMEOUTS } from './app.js';
import { ADMIN, USER, SUPER_ADMIN } from './credentials.js';

export async function loginAs(page, email, password) {
  await waitForAppReady(page, '/');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByText('Welcome Back')).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page.getByTestId('user-menu-toggle')).toBeVisible({
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
