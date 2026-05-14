import { test, expect } from '@playwright/test';
import { waitForAppReady, TIMEOUTS } from '../helpers/app.js';
import { INCOMPLETE_USER, isConfigured } from '../helpers/credentials.js';
import { AuthPage } from '../pages/AuthPage.js';
import { setupFirebaseProxy } from '../helpers/firebase-proxy.js';

// Stable generic client-side message produced by formatSyncError() for a
// non-5xx, non-network response — specifically the 400 completion-validation
// path this test pins. See client/src/helpers/firebaseErrors.js — do not
// relax this assertion without also updating that helper.
const VALIDATION_SYNC_ERROR = 'An unexpected error occurred.';

// Successful sync-profile response body shape produced by the server's
// formatResponse helper. Used by the happy-path test to mock a completion
// submit WITHOUT writing to the DB, so the seeded incomplete state is
// preserved across runs and retries.
const COMPLETED_PROFILE_RESPONSE = {
  data: {
    user: {
      firebaseUid: 'incomplete-user-uid',
      email: INCOMPLETE_USER.email,
      name: 'E2E',
      surname: 'Incomplete',
    },
    profile: {
      user_id: 'incomplete-user-uid',
      name: 'E2E',
      surname: 'Incomplete',
      email: INCOMPLETE_USER.email,
    },
    isAdmin: false,
    profileState: {
      isProfileComplete: true,
      missingRequiredFields: [],
    },
  },
  error: null,
  message: 'Profile synced',
};

/**
 * Body check: login sync-profile posts {firebaseUid, email} only; the
 * completion submit posts {firebaseUid, email, name, surname}. Distinguishing
 * by body.name lets one route handler cover both cases without a counter.
 */
function isCompletionSubmit(route) {
  const raw = route.request().postData() || '{}';
  try {
    const body = JSON.parse(raw);
    return typeof body.name === 'string' || typeof body.surname === 'string';
  } catch {
    return false;
  }
}

test.describe('Profile Completion Flow', { tag: ['@auth'] }, () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !isConfigured(INCOMPLETE_USER),
      'Incomplete-user E2E credentials not configured',
    );
    // Set up Firebase proxy to bypass CORS issues in CI
    const context = page.context();
    if (!context.__firebaseProxyReady) {
      await setupFirebaseProxy(context);
      context.__firebaseProxyReady = true;
    }
    await waitForAppReady(page);
  });

  // Validation test is defined FIRST so it runs before the happy-path test
  // within this file. Both tests also mock the completion submit, so the
  // seeded DB state stays incomplete regardless of ordering or retries.
  test('submitting completion form shows generic error on validation failure', async ({
    page,
  }) => {
    // Intercept ONLY the completion submit (distinguished by body.name) and
    // return a 400 validation failure. The initial login sync call passes
    // through to the real server so the modal opens from real DB state.
    // This pins the agreed completion-validation UX contract: on a 400 from
    // /api/auth/sync-profile, the client must surface the stable generic
    // message from formatSyncError() — not a backend schema leak.
    await page.route('**/api/auth/sync-profile', async (route) => {
      if (isCompletionSubmit(route)) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            data: null,
            error: 'Validation failed',
            message: 'Invalid profile payload',
          }),
        });
        return;
      }
      await route.fallback();
    });

    const auth = new AuthPage(page);
    await auth.openLoginModal();
    await auth.fillLoginForm(INCOMPLETE_USER.email, INCOMPLETE_USER.password);
    await auth.submitForm();

    const completionHeading = page
      .getByTestId('auth-modal')
      .getByText('Complete Your Profile', { exact: true });

    // Assert the modal actually opens — never skip at runtime. A missing
    // modal here means the seed / incomplete account is broken and the gate
    // MUST fail, not silently pass.
    await expect(completionHeading).toBeVisible({
      timeout: TIMEOUTS.authVerify,
    });

    // Fill valid-looking values so the client proceeds past HTML5 `required`
    // validation and actually POSTs to the completion endpoint. The intercept
    // above converts that POST into a 400, which the client maps through
    // formatSyncError() to the stable generic validation message below.
    await page.locator('#completion-name').fill('E2E');
    await page.locator('#completion-surname').fill('TestUser');

    await page
      .getByTestId('auth-modal')
      .getByRole('button', { name: 'Continue' })
      .click();

    // Modal must stay open on validation error.
    await expect(completionHeading).toBeVisible();

    // The danger alert must render the stable generic validation message
    // from formatSyncError() for the 400 path, not a backend schema leak.
    const dangerAlert = page
      .getByTestId('auth-modal')
      .locator('.alert-danger');
    await expect(dangerAlert).toBeVisible({ timeout: TIMEOUTS.authVerify });
    await expect(dangerAlert).toHaveText(VALIDATION_SYNC_ERROR);
  });

  test('user with incomplete profile sees modal and completes it successfully', async ({
    page,
  }) => {
    // Intercept ONLY the completion submit and respond with a 200 that
    // carries isProfileComplete=true. This keeps the seeded DB state
    // incomplete across runs / retries while still pinning the client
    // contract: on a successful completion response the modal closes and
    // the user menu becomes visible.
    await page.route('**/api/auth/sync-profile', async (route) => {
      if (isCompletionSubmit(route)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(COMPLETED_PROFILE_RESPONSE),
        });
        return;
      }
      await route.fallback();
    });

    const auth = new AuthPage(page);
    await auth.openLoginModal();
    await auth.fillLoginForm(INCOMPLETE_USER.email, INCOMPLETE_USER.password);
    await auth.submitForm();

    const completionHeading = page
      .getByTestId('auth-modal')
      .getByText('Complete Your Profile', { exact: true });

    // Assert the modal actually opens — never skip at runtime.
    await expect(completionHeading).toBeVisible({
      timeout: TIMEOUTS.authVerify,
    });

    await page.locator('#completion-name').fill('E2E');
    await page.locator('#completion-surname').fill('TestUser');

    await page
      .getByTestId('auth-modal')
      .getByRole('button', { name: 'Continue' })
      .click();

    await expect(completionHeading).toBeHidden({
      timeout: TIMEOUTS.authVerify,
    });
    await expect(auth.userMenuToggle).toBeVisible({
      timeout: TIMEOUTS.authVerify,
    });
  });
});
