/**
 * Role-based authenticated context/page fixtures for E2E tests.
 *
 * BOUNDARY CONTRACT:
 * - Fixtures manage auth, context, and seeding only. No assertions.
 * - Each context fixture performs a live UI login via `loginAs()` inside a
 *   fresh browser context. The Firebase SDK handles auth persistence
 *   natively within the browser context's IndexedDB — no storageState
 *   files are used.
 * - Tests that test auth UI (login, signup, auth modal) should import
 *   directly from @playwright/test, not from this file.
 * - Tests using these fixtures should call `test.skip(!isConfigured(ROLE))`
 *   in a beforeEach hook for clear skip messages. The fixtures themselves
 *   are skip-safe: when credentials are not configured, context fixtures
 *   yield `null` (no throw), and page fixtures propagate `null`. The
 *   spec's `test.skip()` guard then marks the test as skipped cleanly.
 *
 * CONCURRENCY MODEL:
 * - Context fixtures (`adminContext`, `userContext`, `superAdminContext`)
 *   are worker-scoped. Each Playwright worker authenticates once per role,
 *   then reuses the same browser context for all tests in that worker.
 *   This avoids re-signing in on every test, which would hammer shared
 *   Firebase accounts under `fullyParallel` mode and risk rate limiting.
 * - Page fixtures (`adminPage`, `userPage`, `superAdminPage`) remain
 *   test-scoped — each test gets a fresh page from the shared context.
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
import { loginAs } from "../helpers/auth.js";
import { ADMIN, USER, SUPER_ADMIN, isConfigured } from "../helpers/credentials.js";
import { dismissProfileModalIfVisible } from "../helpers/profile-modal.js";

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

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

/**
 * Pre-warm the React app's auth state on a fresh page.
 *
 * When a new page navigates directly to a protected route (e.g. /admin),
 * Redux is empty → ProtectedRoute/AdminRoute redirects to "/". Then
 * onAuthStateChanged fires, which may open the profile-completion modal
 * before the route guard re-evaluates.
 *
 * By navigating to "/" first, waiting for auth to settle, and dismissing
 * the modal if it appears, subsequent navigations within the same page
 * will find Redux already populated → no spurious redirects or modals.
 */
async function warmAuth(page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator("#root").waitFor({ state: "visible", timeout: 15_000 });
  await dismissProfileModalIfVisible(page);
  // Confirm auth settled: user menu should be visible.
  await page.getByTestId("user-menu-toggle").first()
    .waitFor({ state: "visible", timeout: 20_000 });
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

  adminContext: [
    async ({ browser }, use) => {
      if (!isConfigured(ADMIN)) {
        await use(null);
        return;
      }
      const contextOptions = {
        baseURL: BASE_URL,
        ...(BYPASS_SECRET && {
          extraHTTPHeaders: {
            "x-vercel-protection-bypass": BYPASS_SECRET,
            "x-vercel-set-bypass-cookie": "samesitenone",
          },
        }),
      };
      const context = await browser.newContext(contextOptions);
      try {
        const loginPage = await context.newPage();
        try {
          await loginAs(loginPage, ADMIN.email, ADMIN.password);
        } finally {
          await loginPage.close();
        }
        await use(context);
      } finally {
        await context.close();
      }
    },
    { scope: "worker" },
  ],

  adminPage: async ({ adminContext }, use) => {
    if (!adminContext) {
      await use(null);
      return;
    }
    const page = await adminContext.newPage();
    await warmAuth(page);
    await use(page);
  },

  userContext: [
    async ({ browser }, use) => {
      if (!isConfigured(USER)) {
        await use(null);
        return;
      }
      const contextOptions = {
        baseURL: BASE_URL,
        ...(BYPASS_SECRET && {
          extraHTTPHeaders: {
            "x-vercel-protection-bypass": BYPASS_SECRET,
            "x-vercel-set-bypass-cookie": "samesitenone",
          },
        }),
      };
      const context = await browser.newContext(contextOptions);
      try {
        const loginPage = await context.newPage();
        try {
          await loginAs(loginPage, USER.email, USER.password);
        } finally {
          await loginPage.close();
        }
        await use(context);
      } finally {
        await context.close();
      }
    },
    { scope: "worker" },
  ],

  userPage: async ({ userContext }, use) => {
    if (!userContext) {
      await use(null);
      return;
    }
    const page = await userContext.newPage();
    await warmAuth(page);
    await use(page);
  },

  superAdminContext: [
    async ({ browser }, use) => {
      if (!isConfigured(SUPER_ADMIN)) {
        await use(null);
        return;
      }
      const contextOptions = {
        baseURL: BASE_URL,
        ...(BYPASS_SECRET && {
          extraHTTPHeaders: {
            "x-vercel-protection-bypass": BYPASS_SECRET,
            "x-vercel-set-bypass-cookie": "samesitenone",
          },
        }),
      };
      const context = await browser.newContext(contextOptions);
      try {
        const loginPage = await context.newPage();
        try {
          await loginAs(loginPage, SUPER_ADMIN.email, SUPER_ADMIN.password);
        } finally {
          await loginPage.close();
        }
        await use(context);
      } finally {
        await context.close();
      }
    },
    { scope: "worker" },
  ],

  superAdminPage: async ({ superAdminContext }, use) => {
    if (!superAdminContext) {
      await use(null);
      return;
    }
    const page = await superAdminContext.newPage();
    await warmAuth(page);
    await use(page);
  },
});

export { expect };
