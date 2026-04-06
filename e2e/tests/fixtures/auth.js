/**
 * Role-based authenticated context/page fixtures for E2E tests.
 *
 * BOUNDARY CONTRACT:
 * - Fixtures manage auth, context, and seeding only. No UI interaction,
 *   no assertions.
 * - Tests that test auth UI (login, signup, auth modal) should import directly
 *   from @playwright/test, not from this file.
 * - Tests using these fixtures should call `test.skip(!isConfigured(ROLE))`
 *   in a beforeEach hook for clear skip messages. The fixtures themselves are
 *   skip-safe: when credentials are not configured, context fixtures yield
 *   `null` (no throw), and page fixtures propagate `null`. The spec's
 *   `test.skip()` guard then marks the test as skipped cleanly.
 * - When credentials ARE configured but the storageState file is missing,
 *   context fixtures throw with a clear diagnostic — this indicates
 *   global-setup failed and should be investigated.
 *
 * USAGE:
 *   import { test, expect } from './fixtures/auth.js';
 *
 *   test('admin can see dashboard', async ({ adminPage }) => {
 *     await adminPage.goto('/admin');
 *     await expect(adminPage.getByText('Dashboard')).toBeVisible();
 *   });
 */

import { test as base, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ADMIN, USER, SUPER_ADMIN, isConfigured } from "../helpers/credentials.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, "..", "..", ".auth");

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

function authStatePath(role) {
  return path.join(AUTH_DIR, `${role}.json`);
}

function hasAuthState(role) {
  return fs.existsSync(authStatePath(role));
}

/**
 * Build context options that match the runtime options from
 * playwright.config.js (baseURL + Vercel bypass headers), then layer in
 * the storageState for the given role.
 */
function buildContextOptions(role) {
  return {
    baseURL: BASE_URL,
    ...(BYPASS_SECRET && {
      extraHTTPHeaders: {
        "x-vercel-protection-bypass": BYPASS_SECRET,
        "x-vercel-set-bypass-cookie": "samesitenone",
      },
    }),
    storageState: authStatePath(role),
  };
}

/**
 * Seeding orchestration hook.
 *
 * Server-side E2E data is seeded automatically by the Vercel preview
 * startup script (server/scripts/seedE2EOnPreview.js). This function
 * provides a fixture-level hook for any client-side or per-test seeding
 * that future phases may need. Currently a no-op thin shell.
 */
async function ensureSeeded() {
  // Intentionally thin — server-side seeding is handled at deploy time.
  // Future phases can extend this to verify seed readiness or trigger
  // additional client-side test-data setup.
}

export const test = base.extend({
  /** Runs once per test to ensure seed data is available. */
  seedReady: [
    async ({}, use) => {
      await ensureSeeded();
      await use(true);
    },
    { auto: true },
  ],

  /**
   * Namespace-safe identifier for mutation operations.
   * Combines the CI run ID (or local timestamp) with the Playwright worker
   * index to prevent cross-worker and cross-run data collisions.
   * Opt-in — only used by tests that perform mutations.
   */
  testRunId: async ({}, use, testInfo) => {
    const runId = process.env.E2E_RUN_ID || `local-${Date.now()}`;
    await use(`${runId}-w${testInfo.parallelIndex}`);
  },

  adminContext: async ({ browser }, use) => {
    const role = "admin";
    if (!isConfigured(ADMIN)) {
      await use(null);
      return;
    }
    if (!hasAuthState(role)) {
      throw new Error(
        `Admin auth state not found at ${authStatePath(role)} — credentials are configured but storageState file is missing. Verify global-setup completed successfully.`,
      );
    }
    const context = await browser.newContext(buildContextOptions(role));

    const checkPage = await context.newPage();
    let diagnosticError = null;
    try {
      await checkPage.goto('/admin', { waitUntil: 'domcontentloaded', timeout: 15000 });
      const requestsTab = await checkPage.getByRole('tab', { name: 'Requests' }).waitFor({ state: 'visible', timeout: 8000 }).catch(() => null);
      if (requestsTab === null) {
        diagnosticError = new Error('[fixtures] Admin shell not ready: Requests tab not found at /admin — check role claim and seed data');
      }
      if (!diagnosticError) {
        const board = await checkPage.getByText('Inquiries Board').waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);
        if (board === null) {
          diagnosticError = new Error('[fixtures] Admin shell not ready: Inquiries Board not found at /admin — check role claim and seed data');
        }
      }
      if (!diagnosticError) {
        console.log('[fixtures] Admin shell verified: Requests tab and Inquiries Board visible');
      }
    } finally {
      await checkPage.close();
    }
    if (diagnosticError) {
      await context.close();
      throw diagnosticError;
    }

    await use(context);
    await context.close();
  },

  adminPage: async ({ adminContext }, use) => {
    if (!adminContext) {
      await use(null);
      return;
    }
    const page = await adminContext.newPage();
    await use(page);
  },

  userContext: async ({ browser }, use) => {
    const role = "user";
    if (!isConfigured(USER)) {
      await use(null);
      return;
    }
    if (!hasAuthState(role)) {
      throw new Error(
        `User auth state not found at ${authStatePath(role)} — credentials are configured but storageState file is missing. Verify global-setup completed successfully.`,
      );
    }
    const context = await browser.newContext(buildContextOptions(role));
    await use(context);
    await context.close();
  },

  userPage: async ({ userContext }, use) => {
    if (!userContext) {
      await use(null);
      return;
    }
    const page = await userContext.newPage();
    await use(page);
  },

  superAdminContext: async ({ browser }, use) => {
    const role = "super-admin";
    if (!isConfigured(SUPER_ADMIN)) {
      await use(null);
      return;
    }
    if (!hasAuthState(role)) {
      throw new Error(
        `Super-admin auth state not found at ${authStatePath(role)} — credentials are configured but storageState file is missing. Verify global-setup completed successfully.`,
      );
    }
    const context = await browser.newContext(buildContextOptions(role));

    const checkPage = await context.newPage();
    let diagnosticError = null;
    try {
      await checkPage.goto('/admin', { waitUntil: 'domcontentloaded', timeout: 15000 });
      const settingsTab = await checkPage.getByRole('tab', { name: 'Settings' }).waitFor({ state: 'visible', timeout: 10000 }).catch(() => null);
      if (settingsTab === null) {
        diagnosticError = new Error('[fixtures] Super-admin shell not ready: Settings tab not found at /admin — check super-admin claim and seed data');
      }
      if (!diagnosticError) {
        console.log('[fixtures] Super-admin shell verified: Settings tab visible');
      }
    } finally {
      await checkPage.close();
    }
    if (diagnosticError) {
      await context.close();
      throw diagnosticError;
    }

    await use(context);
    await context.close();
  },

  superAdminPage: async ({ superAdminContext }, use) => {
    if (!superAdminContext) {
      await use(null);
      return;
    }
    const page = await superAdminContext.newPage();
    await use(page);
  },
});

export { expect };
