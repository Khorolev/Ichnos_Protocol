# Vercel Project Settings Reference

Complete configuration guide for the Ichnos Protocol Vercel projects (`ichnos-client` and `ichnos-server`). This document assumes the projects may have been previously configured with different settings (e.g., staging aliases, wrong production branch, or stale environment variables) and walks through a clean setup from scratch.

> **This is the authoritative source** for Vercel project settings. [`DEPLOYMENT_GITHUB_ACTIONS.md`](DEPLOYMENT_GITHUB_ACTIONS.md) references this file for quick-reference summaries.

---

## Overview — What Must Be Configured

| Area | What | Why |
|---|---|---|
| **Production Branch** | Set to `release` on both projects | The 2-branch model promotes to production via `release`, not `main` |
| **Git Auto-Deploy** | Disabled via `vercel.json` | All deployments are workflow-driven; auto-deploy would bypass CI/E2E |
| **Server Environment Variables** | Runtime secrets and config for the Express backend | The serverless function needs database, Firebase, AI, email, and CORS config |
| **Client Environment Variables** | Build-time config for the Vite frontend | The Vite build injects Firebase, API, and widget config at build time |
| **Old Alias Cleanup** | Remove any previously configured aliases for removed environments | Stale aliases (e.g., for `staging`) waste quota and cause confusion |
| **Token and ID Lookup** | Know where to find the 4 Vercel values needed as GitHub secrets | These are set as GitHub repository secrets, not Vercel environment variables |

---

## 1. Git Integration

For **both** `ichnos-client` and `ichnos-server` Vercel projects:

### Production Branch

1. Open **Vercel Dashboard → Project → Settings → Git**.
2. Set **Production Branch** to `release`.
3. Repeat for the second project.

> **Why `release`?** The 2-branch model (`feature/* → main → release`) uses `release` as the production trigger. The `Promote to Production` workflow discovers the latest READY `main` preview deployment and promotes it to production when code is merged into `release`. If the production branch were set to `main`, Vercel would auto-deploy on every merge to `main` — bypassing E2E validation and the approval gate.

### Disable Git Auto-Deploy

Vercel Git auto-deploy is disabled via `"git": { "deploymentEnabled": false }` in both `vercel.json` files. This ensures **all deployments are driven exclusively through GitHub Actions workflows**, maintaining the enforced pipeline order: CI → Vercel Preview → E2E → manual production promotion.

> **Do not remove** `"git": { "deploymentEnabled": false }` from either `vercel.json` file. If this setting is removed, Vercel will resume auto-deploying on every push, bypassing the entire CI/CD pipeline.

---

## 2. Environment Variables

Environment variables are configured in each Vercel project's settings dashboard, scoped to the appropriate environments (Production, Preview, Development). **Never commit secrets to the repository.**

### `ichnos-server` Environment Variables

Set in **Vercel Dashboard → ichnos-server → Settings → Environment Variables**:

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
| `VERCEL_PROJECT_ID_SERVER` | Vercel → ichnos-server → Settings → General → "Project ID" |

> These four values are set as **GitHub repository secrets** (not Vercel environment variables). They are used by GitHub Actions workflows to authenticate and target Vercel CLI commands. See [`GITHUB_SETTINGS.md`](GITHUB_SETTINGS.md) §2 for where to add them.

---

## Verification Checklist

Use this checklist when setting up new Vercel projects or verifying existing ones:

- [ ] **Production branch** — Set to `release` on both `ichnos-client` and `ichnos-server` (§1)
- [ ] **Git auto-deploy** — Disabled via `"git": { "deploymentEnabled": false }` in both `vercel.json` files (§1)
- [ ] **Server environment variables** — All variables set with correct environment scoping (§2)
- [ ] **Client environment variables** — All variables set with correct environment scoping (§2)
- [ ] **CORS_ORIGIN** — Production value matches the frontend production URL; preview value is configured for preview URLs (§2)
- [ ] **VITE_API_BASE_URL** — Production value matches the backend production URL; preview value matches the backend preview URL (§2)
- [ ] **Old aliases** — Removed if previously configured (§3)
- [ ] **Vercel IDs** — All four IDs (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_CLIENT`, `VERCEL_PROJECT_ID_SERVER`) are set as GitHub repository secrets (§4)
