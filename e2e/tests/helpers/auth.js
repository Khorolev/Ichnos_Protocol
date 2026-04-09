import { expect } from '@playwright/test';
import { waitForAppReady, TIMEOUTS } from './app.js';
import { ADMIN, USER, SUPER_ADMIN } from './credentials.js';
import { AuthPage } from '../pages/AuthPage.js';
import { setupFirebaseProxy } from './firebase-proxy.js';
import { dismissProfileModalIfVisible } from './profile-modal.js';

export async function loginAs(page, email, password) {
  // Set up Firebase API proxy on the context to bypass CORS issues in CI.
  // Uses a context-level flag to avoid duplicate route registration.
  const context = page.context();
  if (!context.__firebaseProxyReady) {
    await setupFirebaseProxy(context);
    context.__firebaseProxyReady = true;
  }

  const auth = new AuthPage(page);
  await waitForAppReady(page, '/');
  await auth.openLoginModal();
  await expect(auth.welcomeBackText).toBeVisible();
  await auth.fillLoginForm(email, password);

  // Capture console errors and API responses (with bodies) for diagnostics
  const consoleErrors = [];
  const apiResponses = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/')) {
      const body = await res.text().catch(() => '<unreadable>');
      apiResponses.push({ url, status: res.status(), body });
      // Log sync-profile and me responses immediately for diagnostics
      if (url.includes('sync-profile') || url.includes('/me')) {
        console.log(`[loginAs] ${res.status()} ${url} → ${body.slice(0, 500)}`);
      }
    }
  });

  await auth.submitForm();

  // After submitting, the user menu becomes visible (auth succeeded),
  // but the profile-completion modal may open moments later when the
  // onAuthStateChanged → getMe response returns isProfileComplete=false.
  // The modal overlay blocks clicks but not visibility checks. So:
  // wait for user menu first, THEN check for and dismiss the modal.
  try {
    await expect(auth.userMenuToggle).toBeVisible({
      timeout: TIMEOUTS.authVerify,
    });
    await dismissProfileModalIfVisible(page);
  } catch (err) {
    const alertText = await auth.alert.textContent().catch(() => 'no alert visible');

    console.error(
      `[loginAs] Auth failed for ${email}.\n` +
        `  Error: ${err.message?.split('\n')[0]}\n` +
        `  Alert text: "${alertText}"\n` +
        `  Console errors: ${JSON.stringify(consoleErrors)}\n` +
        `  API/Firebase responses: ${JSON.stringify(apiResponses, null, 2)}`,
    );
    const screenshot = await page.screenshot().catch(() => null);
    if (screenshot) {
      const fs = await import('fs');
      const path = await import('path');
      const dir = path.join(process.cwd(), 'test-results');
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `loginAs-fail-${email.replace(/[^a-z0-9]/gi, '_')}.png`);
      fs.writeFileSync(file, screenshot);
      console.error(`[loginAs] Screenshot saved: ${file}`);
    }
    throw err;
  }
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
