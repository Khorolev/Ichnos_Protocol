# E2E Test Suite — Current State Analysis (Post-T2)

This document captures the current state of the E2E test suite after the T1 and T2 stabilization passes. Each section is anchored for cross-referencing from the approach document (`refactoring-approach.md`).

---

## A1 — Auth Setup (Current State)

`e2e/global-setup.js` now generates `storageState` files for each configured role (admin, user, super-admin) via the Firebase REST API + browser localStorage injection — no login UI interaction.

### Lifecycle

1. Wipe `e2e/.auth/` directory (`fs.rmSync` + `fs.mkdirSync`).
2. For each configured role: REST sign-in via `identitytoolkit.googleapis.com` → open Chromium context at `BASE_URL` → inject Firebase auth tokens into `localStorage` → reload → structural validation (verify `uid` + `accessToken` exist in `localStorage`) → save `storageState` to `e2e/.auth/<role>.json`.
3. Unconfigured roles (missing email/password env vars) are skipped — no file generated.

### loginAs() helpers

`e2e/tests/helpers/auth.js` `loginAs()` helpers still exist and are used by:
- **`logout.spec.js`** — imports `loginAsUser` to establish an authenticated session before testing the logout flow.
- **`contact.spec.js`** — imports `loginAsUser` for authenticated contact submission tests.
- **`chatbot.spec.js`** — imports `loginAsUser` for authenticated chatbot interaction tests.

Auth-UI specs (`login.spec.js`, `signup.spec.js`, `auth.spec.js`) do **not** import `loginAs()` — they import directly from `@playwright/test` and use unauthenticated browser contexts to test the login/signup flow itself.

These helpers use `TIMEOUTS.authVerify` (20s CI / 10s local) with `domcontentloaded` wait strategy via `waitForAppReady()`.

### Config-level storageState

`playwright.config.js` does **NOT** set `storageState` at global or project level. Auth-UI tests get fresh unauthenticated contexts by default.

### Contrast with pre-T1 state

Previously there was no storageState generation at all. Every test performed a full UI login ceremony via `loginAs()` — approximately 5-10 seconds per test in CI.

---

## A2 — Test Overlap (Resolved)

The analytics/CSV duplication that previously existed between `admin-analytics.spec.js` and `admin-kanban.spec.js` has been resolved. The current admin spec split is clean:

| Spec file | Coverage |
|-----------|----------|
| `admin-analytics.spec.js` | Topic Analytics (recompute flow), CSV Export, Super-Admin Management, Settings Tab Visibility |
| `admin-kanban.spec.js` | Kanban board (basic flow), Request Edit Flow, Chat-only Leads, Request Delete Flow |

There is **no remaining overlap** between these two files. Each spec owns a distinct set of admin features with no duplicated test cases.

---

## A3 — Fixture Boundary Contract (Updated)

### Current fixture layer (`e2e/tests/fixtures/auth.js`)

- Provides `adminContext`, `userContext`, `superAdminContext` (and corresponding page fixtures: `adminPage`, `userPage`, `superAdminPage`) loaded from `storageState` files.
- **Skip-safe**: when credentials are unconfigured, context fixtures yield `null` (no throw); page fixtures propagate `null`. The spec's `test.skip()` guard marks the test as skipped cleanly.
- **Throws on missing state**: when credentials ARE configured but the storageState file is missing, context fixtures throw with a clear diagnostic — this indicates global-setup failed.
- `seedReady` auto-fixture orchestrates seed readiness (currently a thin shell — server-side seeding handled at deploy time).
- `testRunId` namespace fixture for mutation safety (combines CI run ID + worker index).

### Precondition guards (added in T2)

- **`adminContext`**: opens a diagnostic page to `/admin` with `domcontentloaded` wait (15s timeout), asserts Requests tab visible (8s), asserts "Inquiries Board" text visible (5s). Throws `[fixtures] Admin shell not ready: ...` with guidance on checking role claim and seed data if either check fails.
- **`superAdminContext`**: opens a diagnostic page to `/admin` with `domcontentloaded` wait (15s timeout), asserts Settings tab visible (10s). Throws `[fixtures] Super-admin shell not ready: ...` if the check fails.
- Both checks run on a diagnostic page that is **closed after verification** — the test's actual page is separate.
- **Purpose**: fail-fast with clear diagnostics instead of generic Playwright timeouts deep in test bodies.

### Boundary contract

- Fixtures **DO**: manage auth, context, seeding, and precondition verification.
- Fixtures **DO NOT**: navigate to test pages, click buttons, interact with UI elements, or make test assertions.

### loginAs() helpers

`e2e/tests/helpers/auth.js` `loginAs()` helpers remain the auth mechanism for specs that need an authenticated session but import from `@playwright/test` directly: `logout.spec.js`, `contact.spec.js`, and `chatbot.spec.js`. Auth-UI specs (`login.spec.js`, `signup.spec.js`, `auth.spec.js`) do not use `loginAs()` — they test unauthenticated flows.

---

## A4 — Parallel Safety (Unchanged)

The config sets `fullyParallel: true`, but several risks exist:

- **Shared Firebase accounts**: All admin tests share a single `E2E_ADMIN_EMAIL` account. Concurrent tests that modify state could conflict when running in parallel across workers.
- **No per-worker isolation**: There is no mechanism to partition test data by worker. The `seedE2EOnPreview.js` script creates a single shared dataset.
- **CI uses `E2E_WORKERS=2`**: Increased from 1 (T1 baseline) to 2. The `testRunId` fixture provides namespace safety for mutation operations, preventing cross-worker and cross-run data collisions.

---

## A5 — Runtime (Improved)

### Improvements from T1/T2

- **Fixture precondition guards** surface failures faster — no waiting for full test body to timeout when the admin shell is not rendered.
- **`waitForLoadState('networkidle')`** in `AdminPage.navigateToAnalytics()` and explicit click timeouts (20s) reduce flaky navigation.
- **`TIMEOUTS.authVerify`** (20s CI / 10s local) provides bounded auth settling in `loginAs()` helpers.
- **storageState reuse** eliminates per-test login overhead for admin/user fixtures — login cost is now a one-time setup cost (~10-15s total for all roles) regardless of test count.

### Residual overhead

- `loginAs()` is still used in `logout.spec.js`, `contact.spec.js`, and `chatbot.spec.js` — those still pay the full UI login ceremony cost per test.
- Auth-UI specs (`login.spec.js`, `signup.spec.js`, `auth.spec.js`) do not use `loginAs()` — they test the login/signup flow itself with unauthenticated contexts.
- Adding new admin tests no longer increases login overhead (storageState reuse), but adding new tests to the `loginAs()`-dependent specs still does.

---

## Risk Hotspots (Updated)

### Fixed

- **API target drift**: Staging-host deny step in `e2e.yml` + production denylist prevent E2E from running against wrong environments. API sanity preflight in `global-setup.js` (CI-only) aborts if `ApiSanityWarning` is rendered.
- **Fixture diagnostic gap**: Admin/super-admin precondition guards now throw descriptive errors when the admin shell is not present.
- **Modal interaction instability**: `force: true` click on checkbox in `contact.spec.js` resolves pointer interception from modal animation.
- **Auth alert scoping**: `AuthPage.alert` getter now scoped to `auth-modal` (`this.page.getByTestId('auth-modal').getByRole('alert')`) to avoid matching the global `ApiSanityWarning` alert.
- **Tab-switch timing**: `login.spec.js` "clears error when switching to signup tab" uses explicit timeout on the `not.toBeVisible` assertion.

### Residual

- **Shared Firebase accounts**: Still a risk if `E2E_WORKERS` increases beyond 2. `testRunId` fixture mitigates data mutation collisions but not login conflicts.
- **`loginAs()` overhead**: `logout.spec.js`, `contact.spec.js`, and `chatbot.spec.js` still use `loginAsUser()` and pay the full UI login ceremony cost per test.
- **Incomplete POM coverage**: `AdminPage.js`, `AuthPage.js`, `ContactPage.js` exist but coverage is not complete. Some tests still use raw selectors.

---

## Baseline Metrics

### T1 Baseline

Source of truth: committed file **`e2e/baseline-metrics.json`**, populated from CI run [23727551946](https://github.com/Khorolev/Ichnos_Protocol/actions/runs/23727551946).

#### Provenance

| Field | Value |
|-------|-------|
| Workflow | E2E Tests (Playwright) |
| Run ID | `23727551946` |
| Run URL | https://github.com/Khorolev/Ichnos_Protocol/actions/runs/23727551946 |
| Commit SHA | `fcbd24743b02fcf459313d1a603a2c206c08d8a1` |
| Branch | `e2e-testing` |
| Date | 2026-03-30 |
| Profile | E2E_WORKERS=1, Chromium only, retries=1 |

#### Values

| Metric | Value |
|--------|-------|
| Total tests | 55 |
| Passed | 20 |
| Failed | 35 |
| Skipped | 0 |
| Wall-clock time (s) | 1374 |
| Retries triggered | 35 |
| Failure rate | 63.6% (35/55) |

> **Note**: The high failure rate (63.6%) reflects the state of the E2E suite at the time of capture — many admin tests failed due to storageState/auth issues that T1 addressed.

### Post-T2 Baseline

| Metric | Value |
|--------|-------|
| Total tests | TBD — pending next CI run after T2 merge |
| Passed | TBD |
| Failed | TBD |
| Skipped | TBD |
| Wall-clock time (s) | TBD |
| Retries triggered | TBD |
| Failure rate | TBD |

Post-T2 values should be captured from the first `repository_dispatch` CI run after T2 merge, using the `extract-baseline.js` script. The `e2e/baseline-metrics.json` file should be updated manually after that run.

### Updating the baseline

To recapture the baseline after a significant change, use the extraction script:

```bash
node e2e/scripts/extract-baseline.js path/to/report.json \
  --run-id <github-run-id> \
  --run-url "https://github.com/<owner>/<repo>/actions/runs/<run-id>" \
  --commit <sha>
```

Or capture locally with a CI-equivalent profile:

```bash
cd e2e && E2E_WORKERS=1 npx playwright test --grep-invert @destructive --reporter=json > baseline-report.json
node scripts/extract-baseline.js baseline-report.json
```
