# Vercel Project Settings Reference

Complete configuration guide for the Ichnos Protocol Vercel projects (`ichnos-client` and `ichnos-protocolserver`). This document assumes the projects may have been previously configured with different settings (e.g., staging aliases, wrong production branch, or stale environment variables) and walks through a clean setup from scratch.

> **This is the authoritative source** for Vercel project settings. [`DEPLOYMENT_GITHUB_ACTIONS.md`](DEPLOYMENT_GITHUB_ACTIONS.md) references this file for quick-reference summaries.

---

## Overview — What Must Be Configured

| Area                             | What                                                                                                                          | Why                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Production Branch**            | Set to `release` on both projects                                                                                             | The 2-branch model promotes to production via `release`, not `main`                                                                     |
| **Git Auto-Deploy**              | Preview auto-deploy **enabled** via native Vercel integration; production auto-deploy managed via `promote-to-production.yml` | Vercel automatically deploys preview environments for every pull request, feeding the E2E pipeline; production promotion remains manual |
| **Server Environment Variables** | Runtime secrets and config for the Express backend                                                                            | The serverless function needs database, Firebase, AI, email, and CORS config                                                            |
| **Client Environment Variables** | Build-time config for the Vite frontend                                                                                       | The Vite build injects Firebase, API, and widget config at build time                                                                   |
| **Old Alias Cleanup**            | Remove any previously configured aliases for removed environments                                                             | Stale aliases (e.g., for `staging`) waste quota and cause confusion                                                                     |
| **Token and ID Lookup**          | Know where to find the 4 Vercel values needed as GitHub secrets                                                               | These are set as GitHub repository secrets, not Vercel environment variables                                                            |
| **Local Project Linking**        | One-time `cd server && vercel link` to link the server directory to the correct Vercel project                                | Required by the E2E provisioning script to sync Preview env vars via Vercel CLI                                                         |
| **Staging Branch Env Config**    | Branch-scoped overrides for the `staging` branch on both projects                                                             | Staging previews use production Firebase and Neon credentials for manual QA                                                             |

---

## 1. Git Integration

For **both** `ichnos-client` and `ichnos-protocolserver` Vercel projects:

### Production Branch

1. Open **Vercel Dashboard → Project → Settings → Git**.
2. Set **Production Branch** to `release`.
3. Repeat for the second project.

> **Why `release`?** The 2-branch model (`feature/* → main → release`) uses `release` as the production trigger. The `Promote to Production` workflow discovers the latest READY `main` preview deployment and promotes it to production when code is merged into `release`. If the production branch were set to `main`, Vercel would auto-deploy on every merge to `main` — bypassing E2E validation and the approval gate.

### Native Preview Integration

The `"git": { "deploymentEnabled": false }` key has been removed from both `client/vercel.json` and `server/vercel.json` as part of the CI/CD refactor. Vercel now automatically deploys preview environments for every pull request.

> **Do not re-add** `"git": { "deploymentEnabled": false }` to either `vercel.json` file. Doing so would disable preview deployments and break the E2E pipeline, which depends on Vercel creating a preview URL automatically when a PR is opened.

### Repository Dispatch Events

**Repository Dispatch Events** must be enabled on the **`ichnos-protocolserver`** project to trigger `e2e.yml` automatically after a server preview deployment. To enable: Vercel Dashboard → `ichnos-protocolserver` → Settings → Git → enable "Repository Dispatch Events". This causes Vercel to emit a `repository_dispatch` event with type `vercel.deployment.success` to GitHub after each successful deployment. The `e2e.yml` workflow filters on the server project name (`contains(project.name, 'server')`) because the server is the slower deployment — by the time the dispatch fires, the client is already ready. Note that the dispatch signals that the server deployment is live, not that E2E seeding is complete; the `e2e.yml` workflow polls `/api/health` for the `seed.mode` readiness signal to confirm seeding status before running tests. Enabling this on the client project (`ichnos-client`) is unnecessary — only the server dispatch is needed to trigger E2E tests. Both trigger modes (`repository_dispatch` and `workflow_dispatch`) resolve E2E targets from GitHub Actions Variables (`vars.E2E_BASE_URL`, `vars.E2E_API_BASE_URL`) — there is no manual URL input. A production-host denylist gate (canonical in `e2e.yml` workflow constants) validates all target URLs before tests run. The denylist constants (`PRODUCTION_HOSTS_CLIENT`, `PRODUCTION_HOSTS_API`) are descriptive only in documentation files; the canonical definitions live in `.github/workflows/e2e.yml` and changes require maintainer-reviewed PRs on that workflow file.

---

## 2. Environment Variables

Environment variables are configured in each Vercel project's settings dashboard, scoped to the appropriate environments (Production, Preview, Development). **Never commit secrets to the repository.**

### `ichnos-protocolserver` Environment Variables

Set in **Vercel Dashboard → ichnos-protocolserver → Settings → Environment Variables**:

| Variable                  | Environments        | Description                                                                           |
| ------------------------- | ------------------- | ------------------------------------------------------------------------------------- |
| `DATABASE_URL`            | Production, Preview | PostgreSQL connection string (Neon Tech)                                              |
| `FIREBASE_PROJECT_ID`     | Production, Preview | Firebase project ID                                                                   |
| `FIREBASE_PRIVATE_KEY`    | Production, Preview | Firebase service account private key (with newlines preserved)                        |
| `FIREBASE_CLIENT_EMAIL`   | Production, Preview | Firebase service account client email                                                 |
| `FIREBASE_STORAGE_BUCKET` | Production, Preview | Firebase Storage bucket name (optional — derived from `FIREBASE_PROJECT_ID` if unset) |
| `XAI_API_KEY`             | Production, Preview | X.ai Grok API key for RAG chatbot                                                     |
| `XAI_API_ENDPOINT`        | Production, Preview | X.ai API endpoint URL (default: `https://api.x.ai/v1/chat/completions`)               |
| `CORS_ORIGIN`             | Production          | Frontend production URL (e.g., `https://ichnos-protocol.com`)                         |
| `CORS_ORIGIN`             | Preview             | Frontend preview URL (or use `VERCEL_URL` dynamically)                                |
| `CRON_SECRET`             | Production, Preview | Shared secret for Vercel cron job authentication                                      |
| `RESEND_API_KEY`          | Production, Preview | Resend API key for transactional email                                                |
| `ADMIN_EMAILS`            | Production, Preview | Comma-separated admin email addresses for notifications                               |
| `CALENDLY_LINK`           | Production, Preview | Calendly booking link                                                                 |
| `CONTACT_CONSENT_VERSION` | Production, Preview | GDPR consent version string (default: `v1`)                                           |
| `CONTACT_CONSENT_TEXT`    | Production, Preview | GDPR consent text shown to users (optional)                                           |
| `PRIVACY_POLICY_URL`      | Production, Preview | Link to privacy policy page (optional)                                                |
| `E2E_ADMIN_EMAIL`         | Preview             | Admin test account email (required for auto-seed on startup)                          |
| `E2E_ADMIN_UID`           | Preview             | Admin test account Firebase UID (required for auto-seed on startup)                   |
| `E2E_USER_EMAIL`          | Preview             | Regular user test account email (optional auto-seed)                                  |
| `E2E_USER_UID`            | Preview             | Regular user test account Firebase UID (optional auto-seed)                           |
| `E2E_SUPER_ADMIN_EMAIL`   | Preview             | Super-admin test account email (optional auto-seed)                                   |
| `E2E_SUPER_ADMIN_UID`     | Preview             | Super-admin test account Firebase UID (optional auto-seed)                            |
| `SKIP_E2E_SEED`           | Preview             | Set to `true` to suppress E2E seed writes; `/api/health` reports `seed.mode=skipped`  |

> These vars are read by `server/scripts/seedE2EOnPreview.js` at server startup when `VERCEL_ENV === 'preview'`. The seed script reports status via `seed.mode` in the `/api/health` response (enum: `seeded | skipped | in_progress | failed`). The E2E workflow uses `seed.mode` as its canonical readiness signal: `seeded` and `skipped` are accepted as ready states; `failed` triggers immediate workflow failure.

### `ichnos-client` Environment Variables

Set in **Vercel Dashboard → ichnos-client → Settings → Environment Variables**:

| Variable                            | Environments        | Description                  |
| ----------------------------------- | ------------------- | ---------------------------- |
| `VITE_FIREBASE_API_KEY`             | Production, Preview | Firebase Web API key         |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Production, Preview | Firebase auth domain         |
| `VITE_FIREBASE_PROJECT_ID`          | Production, Preview | Firebase project ID          |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Production, Preview | Firebase Storage bucket      |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Production, Preview | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID`              | Production, Preview | Firebase app ID              |
| `VITE_CALENDLY_URL`                 | Production, Preview | Calendly booking embed URL   |

> **Reminder:** All client environment variables must be prefixed with `VITE_` to be exposed to the Vite build process.

---

## 3. Clean Up Old Aliases

If you previously configured alias domains on either project from an earlier deployment model (e.g., aliases for a removed environment), remove them:

1. Open **Vercel Dashboard → Project → Settings → Domains**.
2. Remove any alias domains that do not correspond to the current 2-branch model (production and preview only).
3. Repeat for both projects.

The current 2-branch model does not use additional aliased environments. Preview deployments on `main` PRs serve that purpose.

---

## 4. Token and ID Lookup

Quick reference for finding the Vercel values needed as GitHub repository secrets:

| Value                      | Where to Find                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| `VERCEL_TOKEN`             | Vercel → Settings → Tokens → Create (or use an existing token)                                   |
| `VERCEL_ORG_ID`            | Vercel → Settings → General → "Your ID" (for personal accounts) or "Team ID" (for team accounts) |
| `VERCEL_PROJECT_ID_CLIENT` | Vercel → ichnos-client → Settings → General → "Project ID"                                       |
| `VERCEL_PROJECT_ID_SERVER` | Vercel → ichnos-protocolserver → Settings → General → "Project ID"                               |

> These four values are set as **GitHub repository secrets** (not Vercel environment variables). They are used by GitHub Actions workflows to authenticate and target Vercel CLI commands. See [`GITHUB_SETTINGS.md`](GITHUB_SETTINGS.md) §2 for where to add them.

---

## 5. Local Project Linking (One-Time Prerequisite)

The E2E provisioning script (`node scripts/provision-e2e-firebase-users.js`) syncs environment variables to the Vercel server project via the Vercel CLI. This script is a **local/manual developer/admin tool** — it is not executed by CI or E2E workflows. Those workflows consume the synced Vercel Preview env vars after the script has run. This requires the `server/` directory to be linked to the correct Vercel project.

### Setup

```bash
cd server && vercel link
```

When prompted, select the `ichnos-protocolserver` Vercel project. The linked project must be exactly `ichnos-protocolserver` — the preflight script rejects any other project name. This creates `server/.vercel/project.json` with the project and org IDs.

> **Safety check:** The provisioning script verifies that `server/.vercel/project.json` exists and performs two validations:
>
> 1. **Missing `projectName`** — If the `projectName` field is absent or not a string, the script exits with an error asking you to re-link with `cd server && vercel link` using the latest Vercel CLI (older CLI versions may not write `projectName`).
> 2. **Name is not `ichnos-protocolserver`** — If the `projectName` is not exactly `ichnos-protocolserver`, the script exits to prevent accidentally syncing credentials to the wrong Vercel project. Re-link and select the `ichnos-protocolserver` project.

### What gets synced to Vercel Preview

The provisioning script syncs the following E2E env vars to Vercel Server Preview scope only:

| Variable                | Description                            |
| ----------------------- | -------------------------------------- |
| `E2E_ADMIN_EMAIL`       | Admin test account email               |
| `E2E_ADMIN_UID`         | Admin test account Firebase UID        |
| `E2E_USER_EMAIL`        | Regular user test account email        |
| `E2E_USER_UID`          | Regular user test account Firebase UID |
| `E2E_SUPER_ADMIN_EMAIL` | Super-admin test account email         |
| `E2E_SUPER_ADMIN_UID`   | Super-admin test account Firebase UID  |

> **Important:** Vercel Preview environment variable changes only take effect on **new preview deployments**. After syncing, trigger a new preview deployment or redeploy an existing one for changes to take effect. The provisioning script prints a reminder after each successful sync.
>
> **Environment note:** The provisioning script depends on local CLI installation and PATH, `gh` and `vercel` CLI auth state, the linked `server/.vercel/project.json`, and local `.env.e2e`/`server/.env` files. One terminal or machine may succeed while another fails. For terminal-related errors, first verify: (1) you are in the repo root, (2) `gh auth status`, (3) `vercel whoami`, (4) `cd server && vercel link`.

---

## 6. Staging Branch Environment Configuration

The `staging` branch is a long-lived parallel manual-QA lane that sits outside the `main → release` promotion chain. Deployments to `staging` produce a Vercel Preview build that uses **production** Firebase and **production** Neon credentials, enabling real-user login and production-database QA. All overrides in this section are **branch-scoped** — they apply only when Vercel builds the literal `staging` branch, leaving `feature/*` and `main` preview deployments completely unaffected.

The `sync-staging.yml` workflow auto-merges `main` into `staging` after every server deployment, keeping QA in sync with the latest validated code. See the approach spec for the full 3-branch lifecycle rationale.

### How to Apply Branch-Scoped Overrides

1. Open **Vercel Dashboard → Project → Settings → Environment Variables**.
2. Click **Add New** (or edit an existing variable).
3. Set the **Environment** to **Preview**.
4. Expand the **Git Branch** field and type `staging` (exact match).
5. Enter the variable name and value per the tables below.
6. Save. Repeat for every variable listed.

> Branch-scoped overrides only take effect on new deployments to the `staging` branch. If `staging` was already deployed before adding overrides, trigger a redeployment from the Vercel dashboard.

### ichnos-protocolserver — Branch-Scoped Overrides

| Variable                | Scope                           | Value                             | Why                                                          |
| ----------------------- | ------------------------------- | --------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `DATABASE_URL`          | Preview + Git branch: `staging` | Production Neon connection string | Manual QA reads/writes against production data               |
| `SKIP_E2E_SEED`         | Preview + Git branch: `staging` | `true`                            | Prevents automated E2E seed injection into production DB     |
| `CORS_ORIGIN`           | Preview + Git branch: `staging` | Staging client Vercel preview URL | Server must accept requests from the staging frontend origin |
| `FIREBASE_PROJECT_ID`   | Preview + Git branch: `staging` | Production Firebase project ID    | Real user authentication for manual QA                       |
| `FIREBASE_PRIVATE_KEY`  | Preview + Git branch: `staging` | Production Firebase private key   | Real user authentication for manual QA                       |
| `FIREBASE_CLIENT_EMAIL` | Preview + Git branch: `staging` | Production Firebase client email  | Real user authentication for manual QA                       | Set to `testing@ichnos-protocol.com`, its password is `QualityAssurance` |

> When a push lands on `staging`, Vercel applies the global Preview variables first, then applies the branch-specific overrides. Only the keys listed above replace their Preview equivalents — everything else (rate limiting, E2E account vars, etc.) inherits from the global Preview scope. No variable duplication is required.

### ichnos-client — Branch-Scoped Overrides

| Variable                            | Scope                           | Value                                                                             |
| ----------------------------------- | ------------------------------- | --------------------------------------------------------------------------------- |
| `VITE_FIREBASE_API_KEY`             | Preview + Git branch: `staging` | Production Firebase web API key                                                   |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Preview + Git branch: `staging` | Production Firebase auth domain                                                   |
| `VITE_FIREBASE_PROJECT_ID`          | Preview + Git branch: `staging` | Production Firebase project ID                                                    |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Preview + Git branch: `staging` | Production Firebase storage bucket                                                |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Preview + Git branch: `staging` | Production Firebase sender ID                                                     |
| `VITE_FIREBASE_APP_ID`              | Preview + Git branch: `staging` | Production Firebase app ID                                                        |

> `/api/*` requests are rewritten to the production server via the static `client/vercel.json` rewrite. Staging intentionally uses this same production server rewrite — the production server already connects to the production Neon DB and Firebase (matching the staging branch-scoped overrides above), so no separate staging API endpoint is needed. Do not commit a different `destination` on the `staging` branch; `sync-staging.yml` force-pushes `main` into `staging`, which would overwrite any such change on the next sync.

> These overrides ensure the staging client build connects to the production Firebase project. Feature-branch and `main` previews are unaffected — they continue using the global Preview values (test Firebase).

### Prerequisites — SYNC_PAT GitHub Secret

The `sync-staging.yml` workflow pushes to the `staging` branch using a Personal Access Token (PAT) stored as the GitHub Actions secret **`SYNC_PAT`**.

- This PAT must have `contents: write` scope on the repository.
- A PAT is required (instead of the default `GITHUB_TOKEN`) because pushes via `GITHUB_TOKEN` do not trigger Vercel's native Git integration — meaning the `staging` preview would not redeploy.
- Navigate to **GitHub → Settings → Secrets and variables → Actions → New repository secret** and create `SYNC_PAT` with the PAT value.
- See [`GITHUB_SETTINGS.md`](GITHUB_SETTINGS.md) §2 for the full secrets list.

### Neon Ephemeral Branch Behavior

The Neon–Vercel integration will still create an ephemeral Neon branch when a `staging` preview is built — this is automatic and cannot be prevented.

This is **benign**: the `DATABASE_URL` branch-scoped override supersedes the ephemeral branch's connection string. The server connects to the production Neon database, not the ephemeral branch.

The ephemeral branch is unused and will expire automatically per Neon's free-tier retention policy. **No manual cleanup or action is needed.**

### Staging Verification Checklist

- [ ] **Server overrides** — All 6 variables (`DATABASE_URL`, `SKIP_E2E_SEED`, `CORS_ORIGIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`) set on `ichnos-protocolserver` with scope **Preview + Git branch: `staging`**
- [ ] **Client overrides** — All 6 `VITE_FIREBASE_*` variables set on `ichnos-client` with scope **Preview + Git branch: `staging`**
- [ ] **`SKIP_E2E_SEED`** — Confirmed set to `true` (prevents seed injection into production DB)
- [ ] **`CORS_ORIGIN`** — Value matches the staging client preview URL exactly
- [ ] **`DATABASE_URL`** — Value matches the production Neon connection string (not an ephemeral branch URL)
- [ ] **`SYNC_PAT`** — GitHub Actions secret exists with `contents: write` scope
- [ ] **Override scoping** — All overrides are scoped to **Preview + Git branch: `staging`**, not global Preview
- [ ] **Feature branch isolation** — Push a `feature/*` branch and confirm its preview uses the default (non-production) env vars
- [ ] **`/api/health`** — Deploy `staging` and confirm response shows `seed.mode: skipped`
- [ ] **API routing** — `/api/*` requests are rewritten via `vercel.json` to the production server URL; confirm staging API calls route correctly
- [ ] **Login test** — Access the staging client preview URL and log in with a real production user account

---

## Verification Checklist

Use this checklist when setting up new Vercel projects or verifying existing ones:

- [ ] **Production branch** — Set to `release` on both `ichnos-client` and `ichnos-protocolserver` (§1)
- [ ] **Native preview integration** — Confirm `"deploymentEnabled": false` does **not** exist in either `client/vercel.json` or `server/vercel.json`, and that Vercel creates a preview deployment automatically when a PR is opened (§1)
- [ ] **Server environment variables** — All variables set with correct environment scoping (§2)
- [ ] **Client environment variables** — All variables set with correct environment scoping (§2)
- [ ] **CORS_ORIGIN** — Production value matches the frontend production URL; preview value is configured for preview URLs (§2)
- [ ] **API rewrite** — `client/vercel.json` contains a `/api/:path*` rewrite to the production server URL and a `/(.*) → /index.html` SPA catch-all
- [ ] **Repository Dispatch Events** — Enabled on `ichnos-protocolserver` in Vercel Git settings; disabled (or left disabled) on `ichnos-client` (§1)
- [ ] **E2E auto-seed env vars** — Set on ichnos-protocolserver, Preview scope only: `E2E_ADMIN_EMAIL`, `E2E_ADMIN_UID`, and optionally `E2E_USER_*`, `E2E_SUPER_ADMIN_*` (§2)
- [ ] **SKIP_E2E_SEED** — If needed for non-ephemeral preview DB scenarios, set to `true` on ichnos-protocolserver, Preview scope only (§2)
- [ ] **Old aliases** — Removed if previously configured (§3)
- [ ] **Vercel IDs** — All four IDs (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_CLIENT`, `VERCEL_PROJECT_ID_SERVER`) are set as GitHub repository secrets (§4)
- [ ] **Local project linking** — `server/.vercel/project.json` exists, its `projectName` field is present (re-link with latest Vercel CLI if missing), and the name is exactly `ichnos-protocolserver` (§5)
- [ ] **Staging server overrides** — All 6 server branch-scoped overrides set on `ichnos-protocolserver` for `staging` (§6)
- [ ] **Staging client overrides** — All 6 `VITE_FIREBASE_*` branch-scoped overrides set on `ichnos-client` for `staging` (§6)
- [ ] **`SYNC_PAT` secret** — GitHub Actions secret `SYNC_PAT` exists with `contents: write` scope (§6)
- [ ] **Staging `/api/health`** — Returns `seed.mode: skipped` after deploying `staging` (§6)
