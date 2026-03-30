/**
 * Playwright global setup — validates that configured E2E Firebase accounts
 * can sign in before running tests.
 *
 * Server readiness (HTTP 200 + DB seed completion) is handled by the CI
 * workflow's curl-based polling step, which reliably bypasses Vercel
 * Deployment Protection via headers. Node.js fetch() cannot do this because
 * the Fetch spec strips custom headers on cross-origin redirects.
 *
 * In local development, the server is assumed to be running already.
 */

import { validateFirebaseCredentials } from "./tests/helpers/validate-firebase.js";

export default async function globalSetup() {
  await validateFirebaseCredentials();
}
