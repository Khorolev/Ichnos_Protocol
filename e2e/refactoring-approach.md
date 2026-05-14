# E2E Test Suite — Stabilization Approach (T1/T2 Implemented)

This document captures the architecture decisions and outcomes from the T1 and T2 stabilization passes. Each section is anchored for cross-referencing from the analysis document (`refactoring-analysis.md`).

---

## P1 — StorageState Lifecycle (Implemented)

### Design

Auth state files are **always regenerated fresh** at the start of every Playwright run via `globalSetup`. There is no caching or reuse across runs.

### Lifecycle

1. `globalSetup` wipes the `e2e/.auth/` directory completely (`fs.rmSync` + `fs.mkdirSync`).
2. For each configured role (admin, user, super-admin), `globalSetup` authenticates via the **Firebase REST API** (no login UI interaction), opens a Chromium context to establish the correct origin, injects the auth tokens into `localStorage`, reloads the page, and validates the stored auth state structurally (checks `uid` and `accessToken` exist in `localStorage` — no UI element assertions). The resulting `storageState` is saved to `e2e/.auth/<role>.json`.
3. Unconfigured roles (missing email/password env vars) are skipped — no file is generated.
4. Tests consume these files via **fixture-based browser contexts** (see P2), not via config-level `storageState`.

### Files produced

| Role | File | Env vars required |
|------|------|-------------------|
| Admin | `e2e/.auth/admin.json` | `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` |
| User | `e2e/.auth/user.json` | `E2E_USER_EMAIL`, `E2E_USER_PASSWORD` |
| Super-Admin | `e2e/.auth/super-admin.json` | `E2E_SUPER_ADMIN_EMAIL`, `E2E_SUPER_ADMIN_PASSWORD` |

### Key decisions

- **No config-level `storageState`**: `playwright.config.js` does NOT set `storageState` at the global or project level. This ensures that auth UI tests (`auth.spec.js`, `login.spec.js`, `signup.spec.js`) continue to get a fresh, unauthenticated browser context by default.
- **Sequential role processing**: Roles are processed one at a time in `globalSetup` to avoid Firebase rate limiting and concurrent login conflicts on shared accounts.
- **`e2e/.auth/` is gitignored**: Auth state files contain session tokens and must never be committed.

---

## P2 — Fixture Boundary Contract (Implemented, Updated in T2)

### Location

Fixtures live in `e2e/tests/fixtures/auth.js`. They manage auth, context, and seeding only.

### What fixtures DO

- Provide pre-authenticated `BrowserContext` instances loaded with `storageState` from `e2e/.auth/<role>.json`.
- Provide pre-authenticated `Page` instances created from those contexts.
- Propagate runtime options from `playwright.config.js` (baseURL, Vercel bypass headers) into every fixture context so relative `goto()` calls and preview deployments work correctly.
- Handle context lifecycle (create on setup, close on teardown).
- Throw clear errors when a required auth state file is missing.
- Orchestrate data seeding via the `seedReady` auto-fixture. Server-side seed data is provisioned at deploy time by `server/scripts/seedE2EOnPreview.js`; the fixture provides a hook for verifying seed readiness or adding client-side test-data setup in later phases.

### What fixtures DO NOT

- Navigate to pages.
- Click buttons or interact with UI elements.
- Make assertions (`expect` calls).
- Test business logic or user flows.

### Usage rules

- **Tests that test auth UI** (`auth.spec.js`, `login.spec.js`, `signup.spec.js`) import directly from `@playwright/test`, NOT from the fixtures file. They need unauthenticated browser contexts to test the login/signup flow itself. These specs do **not** import `loginAs()`.
- **Tests that need a pre-authenticated session via fixtures** (admin specs, super-admin specs) import `{ test, expect }` from `./fixtures/auth.js` and use the role-specific page fixtures (`adminPage`, `userPage`, `superAdminPage`).
- **Tests that need an authenticated session but use `loginAs()` directly**: `logout.spec.js`, `contact.spec.js`, and `chatbot.spec.js` import `loginAsUser` from `helpers/auth.js` and perform a UI login ceremony per test. These specs import from `@playwright/test` directly and do not use the fixture system.
- **Tests must still call `test.skip(!isConfigured(ROLE))`** in `beforeEach` for graceful skip when credentials are absent. The fixture will throw if the auth state file is missing, but the skip provides a cleaner test report.

### Role Precondition Guards (T2)

The following precondition checks were added in T2 to provide deterministic fail-fast behavior when the admin shell is not rendered:

- **`adminContext`**: Opens a diagnostic page to `/admin` with `domcontentloaded` wait (15s timeout). Asserts Requests tab visible (8s timeout). Asserts "Inquiries Board" text visible (5s timeout). Throws `[fixtures] Admin shell not ready: Requests tab not found at /admin — check role claim and seed data` or `[fixtures] Admin shell not ready: Inquiries Board not found at /admin — check role claim and seed data` if either check fails.

- **`superAdminContext`**: Opens a diagnostic page to `/admin` with `domcontentloaded` wait (15s timeout). Asserts Settings tab visible (10s timeout). Throws `[fixtures] Super-admin shell not ready: Settings tab not found at /admin — check super-admin claim and seed data` if the check fails.

Both checks run on a diagnostic page that is **closed after verification** — the test's actual page is separate. Purpose: deterministic fail-fast when the admin shell is not rendered (wrong role claim, missing seed data, auth not recognized), producing actionable diagnostics instead of cascading generic timeouts.

---

## T1 Stabilization — CI Workflow Hardening (Implemented)

One component was attempted in T1 to prevent E2E tests from running against misconfigured environments, but neither was successfully retained:

### 1. Parity Guard (Dropped)

The original T1 plan included a workflow step to compare the hostname in `E2E_API_BASE_URL` against the rewrite destination in `client/vercel.json`. This was dropped because Vercel does not support environment-variable interpolation in `vercel.json` rewrite destinations — the destination is a static string.

### Summary

Both T1 CI hardening components (staging-host deny step and API warning preflight) have been removed. The staging-host deny step was removed because it blocked legitimate staging URLs. The API warning preflight was removed because it broke the E2E pipeline. No T1 CI hardening was successfully retained.

---

## P3 — POM Migration (Deferred)

> **Status: Future work / Deferred.** Not implemented in T1 or T2.

Page Object Model (POM) classes exist for `AdminPage`, `AuthPage`, and `ContactPage` (`e2e/tests/pages/`), but coverage is incomplete. Some tests still use raw selectors. Full POM migration was not prioritized for the stabilization pass.

When this work is eventually done:
- Each page/feature should get a POM class encapsulating page-specific selectors and actions.
- POMs own their selectors — tests should not use raw `page.getByRole(...)` for page-specific elements.
- POMs expose action methods and query methods with strict ownership boundaries.

---

## P4 — Test Deduplication (Resolved)

> **Status: Complete.** The overlap previously identified in A2 no longer exists.

The admin spec split is now clean. `admin-kanban.spec.js` contains only kanban-specific tests (board flow, request edit, chat-only leads, request delete), while `admin-analytics.spec.js` is the sole home for topic analytics, CSV export, super-admin management, and settings tab visibility tests. No deduplication work remains.

---

## P4a — Admin Spec Coverage Map

`admin-analytics.spec.js` is the canonical home for all analytics, CSV, and super-admin tests. `admin-kanban.spec.js` owns all kanban board interactions. The following map documents the current ownership.

### `admin-analytics.spec.js`

| Describe block | Tests |
|---|---|
| Admin Analytics - Topic Recompute Flow | navigate to Analytics tab and verify topic table structure; recompute topics shows success alert and refreshes table; recompute topics button disables during analysis; recompute topics shows failure alert on API error and recovers button state |
| Admin Analytics - CSV Export | export CSV triggers file download with correct filename; export CSV creates valid downloadable blob; export CSV shows error alert on failure |
| Admin Analytics - Super-Admin Management | Settings tab is visible for super-admin; Settings tab shows Manage Admins form; add admin shows success alert; remove admin shows success alert; manage admin shows error alert on failure |
| Admin Analytics - Settings Tab Visibility | Settings tab is NOT visible for regular admin |

### `admin-kanban.spec.js`

| Describe block | Tests |
|---|---|
| Admin Kanban - Basic Flow | Requests tab and Inquiries board are visible; expand first lane and verify request columns |
| Admin Kanban - Request Edit Flow | open timeline drawer and edit a request |
| Admin Kanban - Chat-only Leads | switch to Chat-only Leads sub-tab and verify table; open chat lead drawer and verify Q&A |
| Admin Kanban - Request Delete Flow | delete a request from timeline drawer |

---

## P5 — CI Worker Strategy (Implemented)

### Controlled worker increase: 1 → 2

CI worker count has been increased from `"1"` to `"2"` in `.github/workflows/e2e.yml` via the `E2E_WORKERS` environment variable. The `playwright.config.js` worker logic remains unchanged — it reads `E2E_WORKERS` and applies it directly.

### `@destructive` exclusion from default fast path

Tests tagged `@destructive` are excluded from the default CI fast path using `--grep-invert "@destructive"` at the command level in `e2e.yml`. This keeps `playwright.config.js` agnostic to CI filtering policy. Destructive tests can be run in isolation via `workflow_dispatch` with `test_suite=destructive`.

### Rollback threshold

Revert `E2E_WORKERS` to `"1"` if **either** condition is met for **3 consecutive CI runs**:

1. **(a) Failure rate**: Overall failure rate increases ≥ 10 percentage points compared to the T1 baseline (63.6%, from `e2e/baseline-metrics.json`). Rollback trigger: ≥ 73.6%.
2. **(b) Retry-triggered count**: Retry-triggered test count increases ≥ 50% compared to the T1 baseline (35, from `e2e/baseline-metrics.json`). Rollback trigger: ≥ 53.

T1 baseline source: CI run [23727551946](https://github.com/Khorolev/Ichnos_Protocol/actions/runs/23727551946), commit `fcbd2474`, captured 2026-03-30.

The threshold conditions are also documented as a YAML comment directly above the `E2E_WORKERS` variable in `.github/workflows/e2e.yml` for in-context visibility.

### Namespace-safe mutations

A `testRunId` fixture (`e2e/tests/fixtures/auth.js`) provides a per-run, per-worker identifier composed from `E2E_RUN_ID` (set by CI to `github.run_id`) and `testInfo.parallelIndex`. Tests that perform mutations use this fixture to namespace their data (e.g., note values), preventing cross-worker and cross-run collisions.

---

## P6 — Validation (Updated)

### Per-phase validation

T1 and T2 stabilization passes have demonstrated:

1. **No product/UI behavior changes** — confirmed. Only test infrastructure and CI workflow were modified.
2. **No test coverage regression** — test count unchanged at 55. No tests removed.
3. **Skip behavior preserved** — `test.skip(!isConfigured(ROLE))` pattern unchanged in all specs.
4. **Auth UI tests unaffected** — `auth.spec.js`, `login.spec.js`, `signup.spec.js` continue importing from `@playwright/test` directly and receive unauthenticated browser contexts.

### Baseline comparison

Compare against the **T1 baseline** in `e2e/baseline-metrics.json` (55 tests, 20 passed, 35 failed, 0 skipped, 1374s wall clock, 35 retries). Post-T2 baseline is pending the first `repository_dispatch` CI run after T2 merge.

- **Wall-clock time**: Expected improvement from fixture precondition fail-fast and auth settling fixes (T1 baseline: 1374s).
- **Pass/fail ratio**: Expected improvement from targeted spec hardening (T1 baseline: 20 passed / 35 failed).
- **Retries**: Expected reduction from deterministic fixture precondition failures (T1 baseline: 35).

### Rollback threshold verification

The T1 baseline is committed in `e2e/baseline-metrics.json`, captured from CI run [23727551946](https://github.com/Khorolev/Ichnos_Protocol/actions/runs/23727551946) (commit `fcbd2474`, 2026-03-30). Baseline values: 55 tests, 35 failed (63.6% failure rate), 35 retries triggered. Thresholds apply to `E2E_WORKERS=2`.

1. Run 3+ CI cycles after T2 merge (via `repository_dispatch` or `workflow_dispatch`).
2. Collect pass/fail/retry counts from the Playwright HTML report artifacts (`playwright-report` artifact, `index.html` summary row).
3. Compare against the T1 baseline values in `e2e/baseline-metrics.json` (fields: `.metrics.failed`, `.metrics.retries_triggered`):
   - T1 failure rate: 63.6% (35/55)
   - T1 retries triggered: 35
4. If **either** threshold is breached for 3 consecutive runs, revert `E2E_WORKERS` to `"1"` in `.github/workflows/e2e.yml`:
   - (a) Failure rate ≥ 10 percentage points above 63.6% (i.e., ≥ 73.6%).
   - (b) Retry-triggered count ≥ 50% above 35 (i.e., ≥ 53).
5. After reverting, re-run 3 CI cycles to confirm stability returns to baseline.

### Residual risks

The following risks are documented but not blocking for stabilization:

- **Shared Firebase accounts**: Risk increases if `E2E_WORKERS` goes beyond 2. `testRunId` fixture mitigates data mutation collisions but not login conflicts.
- **`loginAs()` overhead**: `logout.spec.js`, `contact.spec.js`, and `chatbot.spec.js` still use `loginAsUser()` and pay the full UI login ceremony cost per test. Migrating these to fixture-based auth would eliminate this overhead.
- **Incomplete POM coverage**: `AdminPage.js`, `AuthPage.js`, `ContactPage.js` exist but not all tests use them. Some tests still use raw selectors.
