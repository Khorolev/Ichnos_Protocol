/**
 * Playwright global setup — validates that configured E2E Firebase accounts
 * can sign in via the Firebase REST API before any tests run.
 *
 * Auth state for tests is managed by the fixtures in
 * `e2e/tests/fixtures/auth.js` via live UI login (`loginAs()`). The
 * Firebase SDK handles auth persistence natively within each browser
 * context's IndexedDB.
 *
 * Server readiness (HTTP 200 + DB seed completion) is handled by the CI
 * workflow's curl-based polling step. In local development, the server is
 * assumed to be running already.
 */

import { validateFirebaseCredentials } from "./tests/helpers/validate-firebase.js";

export default async function globalSetup() {
  await validateFirebaseCredentials();
}
