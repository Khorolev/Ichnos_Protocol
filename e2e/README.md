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
| `E2E_ADMIN_UID` | Optional | Firebase UID of the admin account (used for DB seeding in CI) |
| `E2E_USER_EMAIL` | Optional | Firebase email for authenticated contact-flow tests (returning user status + add question) |
| `E2E_USER_PASSWORD` | Optional | Password for that user account |
| `E2E_API_BASE_URL` | CI-recommended | Full base URL of the API server (e.g. `https://staging-api.ichnos-protocol.com`). In CI, if absent, the runner falls back to `BASE_URL` host + `E2E_API_PORT` — this fallback is unreliable for Vercel host-split deployments where client and API URLs differ. |
| `FIREBASE_API_KEY` | CI-required for Firebase validation | Firebase Web API key used by global setup to validate E2E Firebase accounts. Also accepted as `VITE_FIREBASE_API_KEY` (fallback). |

If `E2E_ADMIN_EMAIL` or `E2E_ADMIN_PASSWORD` are not set, all tests in `admin-kanban.spec.js` are automatically skipped — the pipeline will not fail.

## CI

Tests run automatically on Vercel preview deployments via `.github/workflows/e2e.yml`. Add `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_ADMIN_UID`, `E2E_USER_EMAIL`, and `E2E_USER_PASSWORD` as GitHub repository secrets to enable admin tests, DB seeding, and authenticated contact E2E coverage in CI. For reliable CI runs on Vercel preview deployments, also set `E2E_API_BASE_URL` and `FIREBASE_API_KEY` (or `VITE_FIREBASE_API_KEY`) as GitHub repository secrets.
