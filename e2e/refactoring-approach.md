# E2E Test Suite — Refactoring Approach

This document defines the phased approach for refactoring the E2E test suite. Each section is anchored for cross-referencing from the analysis document (`refactoring-analysis.md`).

---

## P1 — StorageState Lifecycle

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

## P2 — Fixture Boundary Contract

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

- **Tests that test auth UI** (`auth.spec.js`, `login.spec.js`, `signup.spec.js`) import directly from `@playwright/test`, NOT from the fixtures file. They need unauthenticated browser contexts to test the login/signup flow itself.
- **Tests that need a pre-authenticated session** (admin, user flows) import `{ test, expect }` from `./fixtures/auth.js` and use the role-specific page fixtures (`adminPage`, `userPage`, `superAdminPage`).
- **Tests must still call `test.skip(!isConfigured(ROLE))`** in `beforeEach` for graceful skip when credentials are absent. The fixture will throw if the auth state file is missing, but the skip provides a cleaner test report.

---

## P3 — POM Migration

> *Scope: T3 — described here for context only.*

Page Object Model (POM) classes will encapsulate page-specific selectors and actions:

- Each page/feature gets a POM class (e.g., `AdminPage`, `KanbanBoard`, `AnalyticsPanel`).
- POMs own their selectors — tests never use raw `page.getByRole(...)` for page-specific elements.
- POMs expose action methods (`navigateToAnalytics()`, `recomputeTopics()`) and query methods (`getTopicRows()`, `isSettingsTabVisible()`).
- Strict ownership boundaries: a POM for the kanban board does not reach into the analytics panel's DOM.
- Test structure shifts from page-based spec files to feature-oriented specs.

---

## P4 — Test Deduplication

> *Scope: T2 — described here for context only.*

The overlap identified in A2 (topic analytics and CSV export appearing in both `admin-analytics.spec.js` and `admin-kanban.spec.js`) will be resolved:

- `admin-analytics.spec.js` becomes the canonical home for topic analytics and CSV export tests (more thorough versions).
- `admin-kanban.spec.js` retains only kanban-specific tests (board, drawer, edit, delete, chat-only leads).
- Duplicate tests are removed, not merged — the analytics spec already has the more complete versions.

---

## P4a — Analytics / CSV Parity Checklist

After T2 deduplication, `admin-analytics.spec.js` is the canonical home for all analytics and CSV tests. The following checklist maps every user-visible behavior to its canonical test. Future dedupe or refactoring work must verify no item loses coverage.

### Topic Analytics (canonical: `admin-analytics.spec.js` → "Admin Analytics - Topic Recompute Flow")

| Behavior | Canonical Test | Status |
|---|---|---|
| Tab navigation to Analytics | `navigate to Analytics tab and verify topic table structure` | Covered |
| Table structure (Topic, Count, Avg Confidence columns) | `navigate to Analytics tab and verify topic table structure` | Covered |
| Recompute loading state (button shows "Analyzing..." and disables) | `recompute topics button disables during analysis` | Covered |
| Recompute success (alert with "Processed" / "skipped", table refreshes) | `recompute topics shows success alert and refreshes table` | Covered |
| Recompute error (alert with "Topic analysis failed", button recovers) | `recompute topics shows failure alert on API error and recovers button state` | Covered |

### CSV Export (canonical: `admin-analytics.spec.js` → "Admin Analytics - CSV Export")

| Behavior | Canonical Test | Status |
|---|---|---|
| CSV download triggers with correct filename | `export CSV triggers file download with correct filename` | Covered |
| CSV download creates valid blob | `export CSV creates valid downloadable blob` | Covered |
| CSV export error (alert with "CSV export failed") | `export CSV shows error alert on failure` | Covered |

---

## P5 — CI Worker Strategy

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

## P6 — Validation

### Per-phase validation

Each refactoring phase must demonstrate:

1. **No product/UI behavior changes**: The application under test is unchanged. Only test infrastructure is modified.
2. **No test coverage regression**: The same user flows are covered. Test count may decrease (deduplication) but coverage scope must not shrink.
3. **Skip behavior preserved**: Tests for unconfigured roles still skip gracefully via `test.skip(!isConfigured(ROLE))`.
4. **Auth UI tests unaffected**: `auth.spec.js`, `login.spec.js`, and `signup.spec.js` continue to import from `@playwright/test` directly and receive unauthenticated browser contexts.

### Baseline comparison

After completing all phases, run the full suite and compare against the T1 baseline in `e2e/baseline-metrics.json` (55 tests, 20 passed, 35 failed, 0 skipped, 1374s wall clock, 35 retries):

```bash
cd e2e && npx playwright test --reporter=json > post-refactor-report.json
```

Compare:
- **Wall-clock time**: Expected significant reduction from storageState reuse (T1 baseline: 1374s).
- **Test count**: May decrease due to deduplication (T2). Verify no unintended removals (T1 baseline: 55).
- **Pass/fail ratio**: Must remain equal or better (T1 baseline: 20 passed / 35 failed).
- **Skip count**: Must remain equal (same credential gating) (T1 baseline: 0).

### T4 rollback threshold verification checklist

The T1 baseline is committed in `e2e/baseline-metrics.json`, captured from CI run [23727551946](https://github.com/Khorolev/Ichnos_Protocol/actions/runs/23727551946) (commit `fcbd2474`, 2026-03-30). Baseline values: 55 tests, 35 failed (63.6% failure rate), 35 retries triggered.

1. Run 3+ CI cycles after T4 merge (via `repository_dispatch` or `workflow_dispatch`).
2. Collect pass/fail/retry counts from the Playwright HTML report artifacts (`playwright-report` artifact, `index.html` summary row).
3. Compare against the T1 baseline values in `e2e/baseline-metrics.json` (fields: `.metrics.failed`, `.metrics.retries_triggered`):
   - T1 failure rate: 63.6% (35/55)
   - T1 retries triggered: 35
4. If **either** threshold is breached for 3 consecutive runs, revert `E2E_WORKERS` to `"1"` in `.github/workflows/e2e.yml`:
   - (a) Failure rate ≥ 10 percentage points above 63.6% (i.e., ≥ 73.6%).
   - (b) Retry-triggered count ≥ 50% above 35 (i.e., ≥ 53).
5. After reverting, re-run 3 CI cycles to confirm stability returns to baseline.
