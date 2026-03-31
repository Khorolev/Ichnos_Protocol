# E2E Tests (Playwright)

## Running locally

Start the client and server dev servers, then run:

```bash
cd e2e && npx playwright test
```

Run a single spec:

```bash
cd e2e && npx playwright test tests/admin-kanban.spec.js
```

Run in headed mode (visible browser):

```bash
cd e2e && npx playwright test --headed
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `BASE_URL` | No (defaults to `http://localhost:5173`) | Target URL for tests |
| `E2E_ADMIN_EMAIL` | Optional | Firebase email of an admin account for admin Kanban E2E tests |
| `E2E_ADMIN_PASSWORD` | Optional | Firebase password of the admin account |
| `E2E_ADMIN_UID` | Optional | Firebase UID of the admin account (used for DB seeding locally; in CI this is a **Vercel Server Preview env var**, not a GitHub Actions secret) |
| `E2E_USER_EMAIL` | Optional | Firebase email for authenticated contact-flow tests (returning user status + add question) |
| `E2E_USER_PASSWORD` | Optional | Password for that user account |
| `E2E_API_BASE_URL` | **Required for CI** | Full base URL of the API server (e.g. `https://staging-api.ichnos-protocol.com`). In CI, set as a GitHub Actions Variable (`vars.E2E_API_BASE_URL`). The workflow fails if this variable is missing. For local runs, defaults to `http://localhost:3000` if not set. |
| `FIREBASE_API_KEY` | CI-required for Firebase validation | Firebase Web API key used by global setup to validate E2E Firebase accounts. Also accepted as `VITE_FIREBASE_API_KEY` (fallback). |

If `E2E_ADMIN_EMAIL` or `E2E_ADMIN_PASSWORD` are not set, all tests in `admin-kanban.spec.js` are automatically skipped — the pipeline will not fail.

## CI

> **Note:** The workflow file `.github/workflows/e2e.yml` is the canonical source of truth for E2E trigger behavior, URL targeting, denylist values, and seed readiness semantics. This README provides a human-readable summary; if any discrepancy exists, the workflow file takes precedence.

Tests run automatically on Vercel preview deployments via `.github/workflows/e2e.yml`. Add `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_USER_EMAIL`, and `E2E_USER_PASSWORD` as GitHub repository **secrets**, and `E2E_BASE_URL` / `E2E_API_BASE_URL` as GitHub Actions **variables** (`vars.*`). Also set `FIREBASE_API_KEY` (or `VITE_FIREBASE_API_KEY`) and `VERCEL_AUTOMATION_BYPASS_SECRET` as secrets.

> **Note:** `E2E_ADMIN_UID` (and other `E2E_*_UID` values) are **not** GitHub Actions secrets — they are Vercel Server Preview environment variables consumed by the seed script at server startup. Use the provisioning script (`node scripts/provision-e2e-firebase-users.js`) to sync them to Vercel automatically.

### URL targeting

Both `repository_dispatch` (automated) and `workflow_dispatch` (manual) modes resolve E2E targets from the same GitHub Actions variables: `vars.E2E_BASE_URL` (client) and `vars.E2E_API_BASE_URL` (API). There is no manual `base_url` input — both modes are deterministic and policy-consistent.

### Seed readiness

The workflow polls `/api/health` and gates on `seed.mode`:

- `seeded` or `skipped` — ready, proceed to tests
- `failed` — terminal error, workflow fails immediately
- `in_progress` — keep polling until timeout

The `seed.mode` field is the canonical readiness signal. `seed.seeded` (boolean) is preserved for backward compatibility but is not used for workflow control flow.

### Production-host denylist

Before tests run, a safety gate validates that target URLs do not match production hostnames. The gate is fail-closed: missing denylist constants or unparseable URLs abort the workflow. Hostname comparison uses exact match after lowercase normalization and port removal. The canonical denylist values are defined as workflow constants in `.github/workflows/e2e.yml` — this README is descriptive only.

### Provisioning

The provisioning script (`node scripts/provision-e2e-firebase-users.js`) is a **local/manual developer/admin tool** run from your own machine. It is **not** executed by `ci.yml` or `e2e.yml`. CI and E2E workflows consume the synced GitHub secrets and Vercel Preview env vars after the script has already run.

> **Troubleshooting:** If the provisioning script fails with terminal or CLI errors, the cause is almost always a local environment/setup issue. The script depends on local CLI installation/PATH, `gh` and `vercel` CLI auth state, `server/.vercel/project.json` linkage, and local `.env.e2e`/`server/.env` files. Verify: (1) `.env.e2e` exists and has the required fields populated (copy from `.env.e2e.example`), (2) `server/.env` exists with Firebase admin credentials (needed unless running `--sync-only`), (3) you are running from the repo root, (4) `gh auth status`, (5) `vercel whoami`, (6) `cd server && vercel link`. Environment differences (CLI installation, auth state, linked project, shell session) can make one terminal work while another fails.
