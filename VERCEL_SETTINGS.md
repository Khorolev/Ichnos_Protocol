# Vercel Project Settings Reference

Complete configuration guide for the Ichnos Protocol Vercel projects (`ichnos-client` and `ichnos-protocolserver`). This document assumes the projects may have been previously configured with different settings (e.g., staging aliases, wrong production branch, or stale environment variables) and walks through a clean setup from scratch.

> **This is the authoritative source** for Vercel project settings. [`DEPLOYMENT_GITHUB_ACTIONS.md`](DEPLOYMENT_GITHUB_ACTIONS.md) references this file for quick-reference summaries.

---

## Overview — What Must Be Configured

| Area | What | Why |
|---|---|---|
| **Production Branch** | Set to `release` on both projects | The 2-branch model promotes to production via `release`, not `main` |
| **Git Auto-Deploy** | Preview auto-deploy **enabled** via native Vercel integration; production auto-deploy managed via `promote-to-production.yml` | Vercel automatically deploys preview environments for every pull request, feeding the E2E pipeline; production promotion remains manual |
| **Server Environment Variables** | Runtime secrets and config for the Express backend | The serverless function needs database, Firebase, AI, email, and CORS config |
| **Client Environment Variables** | Build-time config for the Vite frontend | The Vite build injects Firebase, API, and widget config at build time |
| **Old Alias Cleanup** | Remove any previously configured aliases for removed environments | Stale aliases (e.g., for `staging`) waste quota and cause confusion |
| **Token and ID Lookup** | Know where to find the 4 Vercel values needed as GitHub secrets | These are set as GitHub repository secrets, not Vercel environment variables |
| **Local Project Linking** | One-time `cd server && vercel link` to link the server directory to the correct Vercel project | Required by the E2E provisioning script to sync Preview env vars via Vercel CLI |

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

**Repository Dispatch Events** must be enabled on the **`ichnos-protocolserver`** project to trigger `e2e.yml` automatically after a server preview deployment. To enable: Vercel Dashboard → `ichnos-protocolserver` → Settings → Git → enable "Repository Dispatch Events". This causes Vercel to emit a `repository_dispatch` event with type `vercel.deployment.success` to GitHub after each successful deployment. The `e2e.yml` workflow filters on the server project name (`contains(project.name, 'server')`) because the server is the slower deployment — by the time it completes (including Neon DB seed), the client is already ready. Enabling this on the client project (`ichnos-client`) is unnecessary — only the server dispatch is needed to trigger E2E tests.

---

## 2. Environment Variables

Environment variables are configured in each Vercel project's settings dashboard, scoped to the appropriate environments (Production, Preview, Development). **Never commit secrets to the repository.**

### `ichnos-protocolserver` Environment Variables

Set in **Vercel Dashboard → ichnos-protocolserver → Settings → Environment Variables**:

| Variable | Environments | Description |
|---|---|---|
| `DATABASE_URL` | Production, Preview | PostgreSQL connection string (Neon Tech) |
| `FIREBASE_PROJECT_ID` | Production, Preview | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Production, Preview | Firebase service account private key (with newlines preserved) |
| `FIREBASE_CLIENT_EMAIL` | Production, Preview | Firebase service account client email |
| `FIREBASE_STORAGE_BUCKET` | Production, Preview | Firebase Storage bucket name (optional — derived from `FIREBASE_PROJECT_ID` if unset) |
| `XAI_API_KEY` | Production, Preview | X.ai Grok API key for RAG chatbot |
| `XAI_API_ENDPOINT` | Production, Preview | X.ai API endpoint URL (default: `https://api.x.ai/v1/chat/completions`) |
| `CORS_ORIGIN` | Production | Frontend production URL (e.g., `https://ichnos-protocol.com`) |
| `CORS_ORIGIN` | Preview | Frontend preview URL (or use `VERCEL_URL` dynamically) |
| `CRON_SECRET` | Production, Preview | Shared secret for Vercel cron job authentication |
| `RESEND_API_KEY` | Production, Preview | Resend API key for transactional email |
| `ADMIN_EMAILS` | Production, Preview | Comma-separated admin email addresses for notifications |
| `CALENDLY_LINK` | Production, Preview | Calendly booking link |
| `CONTACT_CONSENT_VERSION` | Production, Preview | GDPR consent version string (default: `v1`) |
| `CONTACT_CONSENT_TEXT` | Production, Preview | GDPR consent text shown to users (optional) |
| `PRIVACY_POLICY_URL` | Production, Preview | Link to privacy policy page (optional) |
| `E2E_ADMIN_EMAIL` | Preview | Admin test account email (required for auto-seed on startup) |
| `E2E_ADMIN_UID` | Preview | Admin test account Firebase UID (required for auto-seed on startup) |
| `E2E_USER_EMAIL` | Preview | Regular user test account email (optional auto-seed) |
| `E2E_USER_UID` | Preview | Regular user test account Firebase UID (optional auto-seed) |
| `E2E_SUPER_ADMIN_EMAIL` | Preview | Super-admin test account email (optional auto-seed) |
| `E2E_SUPER_ADMIN_UID` | Preview | Super-admin test account Firebase UID (optional auto-seed) |

> These vars are read by `server/scripts/seedE2EOnPreview.js` at server startup when `VERCEL_ENV === 'preview'`.

### `ichnos-client` Environment Variables

Set in **Vercel Dashboard → ichnos-client → Settings → Environment Variables**:

| Variable | Environments | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Production | Backend production URL |
| `VITE_API_BASE_URL` | Preview | Backend preview URL |
| `VITE_FIREBASE_API_KEY` | Production, Preview | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Production, Preview | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Production, Preview | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Production, Preview | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Production, Preview | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Production, Preview | Firebase app ID |
| `VITE_CALENDLY_URL` | Production, Preview | Calendly booking embed URL |

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

| Value | Where to Find |
|---|---|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens → Create (or use an existing token) |
| `VERCEL_ORG_ID` | Vercel → Settings → General → "Your ID" (for personal accounts) or "Team ID" (for team accounts) |
| `VERCEL_PROJECT_ID_CLIENT` | Vercel → ichnos-client → Settings → General → "Project ID" |
| `VERCEL_PROJECT_ID_SERVER` | Vercel → ichnos-protocolserver → Settings → General → "Project ID" |

> These four values are set as **GitHub repository secrets** (not Vercel environment variables). They are used by GitHub Actions workflows to authenticate and target Vercel CLI commands. See [`GITHUB_SETTINGS.md`](GITHUB_SETTINGS.md) §2 for where to add them.

---

## 5. Local Project Linking (One-Time Prerequisite)

The E2E provisioning script (`node scripts/provision-e2e-firebase-users.js`) syncs environment variables to the Vercel server project via the Vercel CLI. This requires the `server/` directory to be linked to the correct Vercel project.

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

| Variable                  | Description                            |
| ------------------------- | -------------------------------------- |
| `E2E_ADMIN_EMAIL`         | Admin test account email               |
| `E2E_ADMIN_UID`           | Admin test account Firebase UID        |
| `E2E_USER_EMAIL`          | Regular user test account email        |
| `E2E_USER_UID`            | Regular user test account Firebase UID |
| `E2E_SUPER_ADMIN_EMAIL`   | Super-admin test account email         |
| `E2E_SUPER_ADMIN_UID`     | Super-admin test account Firebase UID  |

> **Important:** Vercel Preview environment variable changes only take effect on **new preview deployments**. After syncing, trigger a new preview deployment or redeploy an existing one for changes to take effect. The provisioning script prints a reminder after each successful sync.

---

## Verification Checklist

Use this checklist when setting up new Vercel projects or verifying existing ones:

- [ ] **Production branch** — Set to `release` on both `ichnos-client` and `ichnos-protocolserver` (§1)
- [ ] **Native preview integration** — Confirm `"deploymentEnabled": false` does **not** exist in either `client/vercel.json` or `server/vercel.json`, and that Vercel creates a preview deployment automatically when a PR is opened (§1)
- [ ] **Server environment variables** — All variables set with correct environment scoping (§2)
- [ ] **Client environment variables** — All variables set with correct environment scoping (§2)
- [ ] **CORS_ORIGIN** — Production value matches the frontend production URL; preview value is configured for preview URLs (§2)
- [ ] **VITE_API_BASE_URL** — Production value matches the backend production URL; preview value matches the backend preview URL (§2)
- [ ] **Repository Dispatch Events** — Enabled on `ichnos-protocolserver` in Vercel Git settings; disabled (or left disabled) on `ichnos-client` (§1)
- [ ] **E2E auto-seed env vars** — Set on ichnos-protocolserver, Preview scope only: `E2E_ADMIN_EMAIL`, `E2E_ADMIN_UID`, and optionally `E2E_USER_*`, `E2E_SUPER_ADMIN_*` (§2)
- [ ] **Old aliases** — Removed if previously configured (§3)
- [ ] **Vercel IDs** — All four IDs (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_CLIENT`, `VERCEL_PROJECT_ID_SERVER`) are set as GitHub repository secrets (§4)
- [ ] **Local project linking** — `server/.vercel/project.json` exists, its `projectName` field is present (re-link with latest Vercel CLI if missing), and the name is exactly `ichnos-protocolserver` (§5)
