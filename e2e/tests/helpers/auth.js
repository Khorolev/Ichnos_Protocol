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

  // Capture API responses after submit for diagnostics
  const apiResponses = [];
  page.on('response', (res) => {
    const url = res.url();
    if (url.includes('/api/')) {
      apiResponses.push({ url, status: res.status(), type: res.headers()['content-type'] });
    }
  });

  await auth.submitForm();

  try {
    await expect(auth.userMenuToggle).toBeVisible({
      timeout: TIMEOUTS.authVerify,
    });
  } catch (err) {
    // Log diagnostics before re-throwing
    console.error(
      `[loginAs] Auth failed for ${email}. API responses captured:\n` +
        JSON.stringify(apiResponses, null, 2),
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
