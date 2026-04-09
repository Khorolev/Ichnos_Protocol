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
 * This helper detects the modal and fills it with E2E-safe defaults so tests
 * can proceed without being blocked.
 */

const PROFILE_MODAL_TIMEOUT = 8_000;

/**
 * If the profile-completion modal is visible, fill the required fields
 * and submit. Otherwise return immediately (no-op).
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ name?: string, surname?: string }} [defaults]
 */
export async function dismissProfileModalIfVisible(page, defaults = {}) {
  const modal = page.getByTestId('auth-modal');
  const completeHeading = modal.getByText('Complete Your Profile');

  // Wait briefly for the modal to appear — isVisible() is instant and
  // doesn't accept a timeout, so we use waitFor + catch instead.
  try {
    await completeHeading.waitFor({ state: 'visible', timeout: PROFILE_MODAL_TIMEOUT });
  } catch {
    return; // Modal didn't appear within the timeout — nothing to do.
  }

  console.log('[profile-modal] Profile completion modal detected — filling and submitting.');

  const name = defaults.name || 'E2E';
  const surname = defaults.surname || 'TestUser';

  const nameInput = page.locator('#completion-name');
  const surnameInput = page.locator('#completion-surname');
  const continueButton = modal.getByRole('button', { name: 'Continue' });

  await nameInput.fill(name);
  await surnameInput.fill(surname);
  await continueButton.click();

  // Wait for the modal to close after successful submission.
  await completeHeading.waitFor({ state: 'hidden', timeout: 10_000 });

  console.log('[profile-modal] Profile completion modal dismissed.');
}
