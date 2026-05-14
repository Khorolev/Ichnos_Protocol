/**
 * Profile Completion Modal Handler
 *
 * After login (or auth-state restoration on a new page), the app may open
 * an unclosable "Complete Your Profile" modal when the server reports
 * `isProfileComplete === false`.
 *
 * For E2E test users whose DB profiles are already seeded, this can happen
 * due to race conditions between ProtectedRoute redirects, onAuthStateChanged,
 * and the sync-profile / getMe endpoints.
 *
 * The primary mechanism is `setupAutoModalDismiss` which uses Playwright's
 * `addLocatorHandler` to auto-fill and submit the modal whenever it blocks
 * an action. This handles the modal appearing on ANY page navigation, not
 * just during initial login.
 *
 * `dismissProfileModalIfVisible` is kept as a one-shot fallback for use
 * during login when no subsequent action triggers the locator handler.
 */

const PROFILE_MODAL_TIMEOUT = 8_000;

/**
 * Register a Playwright locator handler that auto-dismisses the profile
 * completion modal whenever it blocks an action (click, fill, etc.).
 *
 * Call this ONCE per page. It persists across navigations within the
 * same page object, so a single registration covers all `goto()` calls.
 *
 * Uses a page-level flag to prevent duplicate registrations.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ name?: string, surname?: string }} [defaults]
 */
export async function setupAutoModalDismiss(page, defaults = {}) {
  if (page.__autoModalDismissReady) return;
  page.__autoModalDismissReady = true;

  const name = defaults.name || 'E2E';
  const surname = defaults.surname || 'TestUser';

  const modal = page.getByTestId('auth-modal');
  const completeHeading = modal.getByText('Complete Your Profile');

  await page.addLocatorHandler(completeHeading, async () => {
    console.log('[profile-modal] Auto-handler: profile modal blocking action — filling and submitting.');

    await page.locator('#completion-name').fill(name);
    await page.locator('#completion-surname').fill(surname);
    await modal.getByRole('button', { name: 'Continue' }).click();

    console.log('[profile-modal] Auto-handler: profile modal submitted.');
  });
}

/**
 * If the profile-completion modal is visible, fill the required fields
 * and submit. Otherwise return immediately (no-op).
 *
 * This is a one-shot check useful during login when the modal may appear
 * but no subsequent Playwright action would trigger the locator handler.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ name?: string, surname?: string }} [defaults]
 */
export async function dismissProfileModalIfVisible(page, defaults = {}) {
  const modal = page.getByTestId('auth-modal');
  const completeHeading = modal.getByText('Complete Your Profile');

  try {
    await completeHeading.waitFor({ state: 'visible', timeout: PROFILE_MODAL_TIMEOUT });
  } catch {
    return;
  }

  console.log('[profile-modal] Profile completion modal detected — filling and submitting.');

  const name = defaults.name || 'E2E';
  const surname = defaults.surname || 'TestUser';

  await page.locator('#completion-name').fill(name);
  await page.locator('#completion-surname').fill(surname);
  await modal.getByRole('button', { name: 'Continue' }).click();

  await completeHeading.waitFor({ state: 'hidden', timeout: 10_000 });

  console.log('[profile-modal] Profile completion modal dismissed.');
}
