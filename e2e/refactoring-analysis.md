# E2E Test Suite — Refactoring Analysis

This document captures the current state of the E2E test suite and identifies areas for improvement. Each section is anchored for cross-referencing from the approach document (`refactoring-approach.md`).

---

## A1 — Auth Cascade

Every test that requires an authenticated session performs a **full UI login ceremony** via `loginAs()` helpers (`e2e/tests/helpers/auth.js`). This means:

- Each `test.beforeEach` in `admin-analytics.spec.js` (4 `describe` blocks) and `admin-kanban.spec.js` (4 `describe` blocks) calls `loginAsAdmin(page)` or `loginAsSuperAdmin(page)`.
- The login flow navigates to `/`, clicks the Login button, fills email/password, submits, and waits for `user-menu-toggle` — approximately 5-10 seconds per test in CI.
- There is **no `storageState` reuse** — Playwright's built-in mechanism for persisting and restoring browser auth state is completely unused.
- `playwright.config.js` has no `storageState` at any level (global or per-project).
- `global-setup.js` only validates Firebase credentials via REST API; it does not generate any browser state.

**Impact**: With ~15 admin tests, the login ceremony alone accounts for 75-150 seconds of wall-clock time in CI (sequential within workers). This overhead grows linearly with each new admin test added.

---

## A2 — Test Overlap

There is **significant duplication** between `admin-analytics.spec.js` and `admin-kanban.spec.js`:

| Feature | `admin-analytics.spec.js` | `admin-kanban.spec.js` |
|---------|--------------------------|------------------------|
| Topic Analytics — table structure | "navigate to Analytics tab and verify topic table structure" (line 12) | "switch to Analytics tab and see topic table" (line 154) |
| Topic Analytics — recompute | "recompute topics shows success alert and refreshes table" (line 32) | "recompute topics triggers analysis" (line 166) |
| CSV Export — download trigger | "export CSV triggers file download with correct filename" (line 94) | "export CSV triggers download" (line 190) |

The `admin-kanban.spec.js` versions are simpler duplicates of the more thorough tests in `admin-analytics.spec.js`. This means:
- Both files pay the login cost for overlapping coverage.
- Failures in the same feature appear in two different spec files, complicating triage.
- The kanban spec file mixes kanban-specific tests (board, drawer, edit, delete) with analytics/export tests that belong elsewhere.

---

## A3 — Fixture Boundaries

The current test infrastructure has **no fixture abstraction layer**:

- Auth helpers (`e2e/tests/helpers/auth.js`) mix the login UI ceremony with `expect` assertions (e.g., `expect(page.getByTestId('user-menu-toggle')).toBeVisible()`).
- There is no `e2e/tests/fixtures/` directory — Playwright's fixture extension pattern is unused.
- There is no seeding orchestration layer — tests rely entirely on the server's auto-seed at preview startup (`seedE2EOnPreview.js`) with no test-level control.
- Helper functions (`app.js`, `auth.js`, `credentials.js`, `validate-firebase.js`) are flat — no composition or layering.

**Consequence**: Adding a new role or changing the login flow requires updating every spec file's `beforeEach` block individually. There is no single point of change for auth state management.

---

## A4 — Parallel Safety

The config sets `fullyParallel: true`, but several risks exist:

- **Shared Firebase accounts**: All admin tests share a single `E2E_ADMIN_EMAIL` account. Concurrent tests that modify state (e.g., `admin-kanban.spec.js` "edit a request" and "delete a request") could conflict when running in parallel across workers.
- **No per-worker isolation**: There is no mechanism to partition test data by worker. The `seedE2EOnPreview.js` script creates a single shared dataset.
- **Concurrent data mutation**: The kanban edit test changes a request's status to "contacted" and notes to "E2E test note". The delete test (which mocks the DELETE API) could run simultaneously on the same data.
- **CI uses 1 worker** (`E2E_WORKERS` defaults to 1 in CI), which masks these issues. Increasing worker count will surface them.

---

## A5 — Runtime Bottleneck

The login ceremony is the dominant runtime cost:

- Each `loginAs()` call: navigate to `/` (~1-3s), click Login (~0.5s), fill form (~0.5s), submit (~0.5s), wait for auth verify (~2-5s in CI) = **~5-10s per test**.
- With ~15 admin tests at 1 worker: **~75-150s** spent just on login.
- `login.spec.js` (5 tests) and `signup.spec.js` tests also perform login-adjacent UI operations but these are intentional (testing the auth UI itself).
- Non-admin specs (`auth.spec.js`, `contact.spec.js`, `chatbot.spec.js`) do not require login and are unaffected.

**Scaling concern**: Doubling admin tests doubles login overhead. With `storageState` reuse, the login cost becomes a **one-time setup cost** (~10-15s total for all roles) regardless of test count.

---

## Baseline Metrics

To track the impact of refactoring, capture a baseline before making changes. The T1 baseline source of truth is the committed file **`e2e/baseline-metrics.json`**, populated from CI run [23727551946](https://github.com/Khorolev/Ichnos_Protocol/actions/runs/23727551946).

### Provenance

| Field | Value |
|-------|-------|
| Workflow | E2E Tests (Playwright) |
| Run ID | `23727551946` |
| Run URL | https://github.com/Khorolev/Ichnos_Protocol/actions/runs/23727551946 |
| Commit SHA | `fcbd24743b02fcf459313d1a603a2c206c08d8a1` |
| Branch | `e2e-testing` |
| Date | 2026-03-30 |
| Profile | E2E_WORKERS=1, Chromium only, retries=1 |

### Baseline values

| Metric | Value |
|--------|-------|
| Total tests | 55 |
| Passed | 20 |
| Failed | 35 |
| Skipped | 0 |
| Wall-clock time (s) | 1374 |
| Retries triggered | 35 |
| Failure rate | 63.6% (35/55) |

> **Note**: The high failure rate (63.6%) reflects the state of the E2E suite at the time of capture — many admin tests fail due to `storageState`/auth issues that this refactoring addresses. The rollback thresholds in `refactoring-approach.md` § P5 use these values as the baseline for comparison.

### Updating the baseline

To recapture the baseline after a significant change (e.g., post-refactoring), use the extraction script:

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

### T4 comparison values

Capture post-T4 values from CI runs using the new worker count (`E2E_WORKERS=2`). Source: `playwright-report` artifact from post-T4 CI runs.

```bash
cd e2e && E2E_WORKERS=2 npx playwright test --grep-invert @destructive --reporter=json > post-t4-report.json
```

Compare post-T4 values against the T1 baseline. Thresholds are absolute — no manual interpretation needed.

| Metric | T1 Baseline | Post-T4 | Delta | Threshold |
|--------|-------------|---------|-------|-----------|
| Total tests | 55 | — | — | — |
| Passed | 20 | — | — | — |
| Failed | 35 (63.6%) | — | — | Failure rate delta < 10pp |
| Skipped | 0 | — | — | — |
| Wall-clock time (s) | 1374 | — | — | — |
| Retries triggered | 35 | — | — | Retry count delta < 50% |
| Date captured | 2026-03-30 | — | — | — |

Rollback conditions are documented in `refactoring-approach.md` § P5 — CI Worker Strategy.
