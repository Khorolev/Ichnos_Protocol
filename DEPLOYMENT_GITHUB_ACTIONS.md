# GitHub Actions Deployment Pipeline

This repository uses a **4-stage deployment pipeline**: `feature/* → e2e-testing → staging → main`. No code reaches Vercel production without passing CI, E2E tests, and a human approval gate. Preview deployments and E2E tests run on every PR targeting `e2e-testing` or `staging`, and merge is blocked until all required checks pass.

## 1. Pipeline Overview

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub Actions
    participant CI as CI Workflow
    participant PF as Preflight — Secret Validation
    participant VP as Vercel Preview (deploy jobs)
    participant E2E as E2E Tests (Playwright)
    participant SAS as Staging Alias Sync
    participant Prod as Vercel Production

    Dev->>GH: Open PR from feature/* to e2e-testing
    GH->>CI: Trigger CI (lint + test + build)
    GH->>PF: Preflight validates all secrets; fork PRs hard-blocked
    CI-->>GH: ✅ CI passes
    PF-->>VP: Secrets valid → deploy both apps to preview
    VP-->>E2E: Deploy jobs complete → E2E job starts (needs dependency)
    E2E-->>GH: ✅ E2E passes — required status check for merge
    Dev->>GH: Merge PR into e2e-testing

    Dev->>GH: Open PR from e2e-testing to staging (auto-merge enabled)
    GH->>CI: Same CI + Preflight + Deploy + E2E pipeline
    E2E-->>GH: ✅ All checks pass → auto-merge executes
    GH->>SAS: Post-merge push to staging triggers Staging Alias Sync
    SAS-->>GH: ✅ Stable staging aliases updated atomically

    Dev->>GH: Open PR from staging to main
    GH->>CI: CI runs (lint + test + build only — no E2E rerun)
    CI-->>GH: ✅ CI passes
    Dev->>GH: Merge PR into main
    GH->>Prod: promote-to-production triggers
    GH-->>Dev: Awaiting approval (production environment) 🔴
    Dev->>GH: Approve 🔴
    GH->>Prod: Both apps deploy to Vercel production
```

## 2. Workflows

| Workflow file | Name | Trigger | Purpose | Gate / Condition |
|---|---|---|---|---|
| `ci.yml` | CI | `push`/`pull_request` to `main`, `e2e-testing`, `staging` | Lint + test + build for client and server | Always runs |
| `vercel-preview-on-main.yml` | Vercel Preview | `pull_request` targeting `e2e-testing` or `staging` (opened/synchronize/reopened) | Preflight secret validation, deploy both apps to preview, run E2E as dependent job | Fork PRs are hard-blocked by `Preflight — Secret Validation` job; all secrets must be present or pipeline fails fast |
| `staging-alias-sync.yml` | Staging Alias Sync | `push` to `staging` (post-merge) | Deploy both apps and assign stable client+server staging aliases atomically | Fails hard if either alias update fails; rolls back client alias if server alias fails |
| `promote-to-production.yml` | Promote to Production | `push` to `main` | Build and deploy both apps to Vercel production | Requires human approval via GitHub `production` environment |
| `vercel-promote-production.yml` | Promote Vercel Preview to Production | `workflow_dispatch` (manual) | Emergency/manual promotion using explicit deployment URL inputs | Requires human approval via GitHub `production` environment |
| `e2e.yml` | E2E Tests (Playwright) | `workflow_dispatch` (manual) | Run Playwright against a provided base URL for ad-hoc diagnostics | Requires `base_url` input |

## 3. One-Time Setup — GitHub

### 3.1 Create the `production` environment

1. Go to **GitHub repository → Settings → Environments → New environment**.
2. Name it exactly `production`.
3. Under **Deployment protection rules**, enable **Required reviewers** and add at least one reviewer.
4. Save.

> Both `promote-to-production.yml` and `vercel-promote-production.yml` target `environment: production`. Without this environment, promotions run without approval.

### 3.2 Required repository secrets

Navigate to **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret | Description |
|---|---|
| `VERCEL_TOKEN` | Personal or team token from Vercel |
| `VERCEL_ORG_ID` | Your Vercel org/owner ID (personal account "Your ID" from Vercel → Settings → General) |
| `VERCEL_PROJECT_ID_CLIENT` | Project ID for `ichnos-client` (Project → Settings → General) |
| `VERCEL_PROJECT_ID_SERVER` | Project ID for `ichnos-server` (Project → Settings → General) |
| `VERCEL_STAGING_ALIAS_CLIENT` | Stable staging hostname for the client (e.g. `staging-client.ichnos.vercel.app`) |
| `VERCEL_STAGING_ALIAS_SERVER` | Stable staging hostname for the server (e.g. `staging-server.ichnos.vercel.app`) |
| `DATABASE_URL` | PostgreSQL connection string (used by E2E seed step) |
| `E2E_ADMIN_EMAIL` | Admin test account email |
| `E2E_ADMIN_PASSWORD` | Admin test account password |
| `E2E_ADMIN_UID` | Admin test account Firebase UID |
| `E2E_USER_EMAIL` | Regular user test account email |
| `E2E_USER_PASSWORD` | Regular user test account password |
| `E2E_USER_UID` | Regular user test account Firebase UID |
| `E2E_SUPER_ADMIN_EMAIL` | Super-admin test account email |
| `E2E_SUPER_ADMIN_PASSWORD` | Super-admin test account password |
| `E2E_SUPER_ADMIN_UID` | Super-admin test account Firebase UID |

> **Note:** This pipeline expects all four Vercel secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_CLIENT`, and `VERCEL_PROJECT_ID_SERVER`. The `VERCEL_ORG_ID` is passed as an environment variable to every Vercel CLI step to ensure deterministic org resolution.

> **Note:** On `e2e-testing` and `staging` PRs, all secrets are validated by the `Preflight — Secret Validation` job before any deployment runs. A missing secret fails the pipeline immediately — there is no silent skip.

### 3.3 Required checks per branch

In **Settings → Branches** (or **Settings → Rules → Rulesets**), configure required status checks for each target branch:

| Target branch | Required status checks |
|---|---|
| `e2e-testing` | `Client — Lint & Test`, `Server — Lint & Test`, `Preflight — Secret Validation`, `Deploy Client Preview`, `Deploy Server Preview`, `E2E Tests (Playwright)` |
| `staging` | `Client — Lint & Test`, `Server — Lint & Test`, `Preflight — Secret Validation`, `Deploy Client Preview`, `Deploy Server Preview`, `E2E Tests (Playwright)` |
| `main` | `Client — Lint & Test`, `Server — Lint & Test` |

> **Note:** Check names are frozen in workflow file headers. Do not rename jobs without updating rulesets.

### 3.4 Fork policy

Fork-origin PRs targeting `e2e-testing` or `staging` are explicitly blocked by the `Preflight — Secret Validation` job with a hard `exit 1`. This produces a clear **failed** required check rather than a pending/skipped state, preventing fork PRs from appearing mergeable. Fork PRs to `main` are not blocked by this mechanism but still require CI checks to pass.

### 3.5 Branch sequence governance

> ⚠️ **Accepted Limitation**: Branch sequence (`feature/* → e2e-testing → staging → main`) is enforced via GitHub rulesets and branch protection settings. This provides strong governance enforcement but is **not an absolute, non-bypassable lineage proof** in all edge cases (e.g., a repository admin with bypass permissions could merge out of sequence). This is an explicitly accepted trade-off in favor of platform-native governance over a custom policy-check workflow.

## 4. One-Time Setup — Vercel

For **both** `ichnos-client` and `ichnos-server` Vercel projects:

1. Open **Vercel Dashboard → Project → Settings → Git**.
2. Ensure the **Production Branch** is set to `main` (not `release`). Pushes to `main` trigger `promote-to-production.yml` which calls `vercel deploy --prod` directly — Vercel's own Git auto-deploy is disabled via `"git": { "deploymentEnabled": false }` in both `vercel.json` files.
3. Save.

**Configure stable staging aliases:**

4. In **Vercel Dashboard → each project → Settings → Domains**, add the alias hostnames that match `VERCEL_STAGING_ALIAS_CLIENT` and `VERCEL_STAGING_ALIAS_SERVER` respectively.
5. These aliases are updated atomically by `staging-alias-sync.yml` after every merge to `staging`.

> **Note:** All deployments are driven exclusively through GitHub Actions workflows. This ensures the enforced pipeline order: **CI → Vercel Preview → E2E → manual production promotion**.

## 5. Daily Developer Workflow

### Feature → e2e-testing (PR-gated)

| Step | Action | Status |
|---|---|---|
| 1 | Create `feature/<name>` branch from `e2e-testing` and open a PR targeting `e2e-testing` | 🔴 Manual |
| 2 | CI runs: lint + test + build for client and server | ✅ Automated |
| 3 | `Preflight — Secret Validation` validates all required secrets; fork PRs are hard-blocked here | ✅ Automated gate |
| 4 | `Vercel Preview` deploys both apps to preview URLs | ✅ Automated |
| 5 | `E2E Tests (Playwright)` runs against client preview URL | ✅ Automated |
| 6 | All required checks pass — PR is mergeable | ✅ Automated gate |
| 7 | Merge PR into `e2e-testing` | 🔴 Manual |

### e2e-testing → staging (auto-merge)

| Step | Action | Status |
|---|---|---|
| 8 | Open PR from `e2e-testing` to `staging` and enable **auto-merge** on the PR | 🔴 Manual (one-time per release cycle) |
| 9 | Same CI + Preflight + Deploy + E2E checks run on the PR | ✅ Automated |
| 10 | Auto-merge executes when all required checks pass | ✅ Automated |
| 11 | Post-merge: `Staging Alias Sync` deploys both apps and updates stable staging aliases atomically | ✅ Automated |

### staging → main (manual promotion)

| Step | Action | Status |
|---|---|---|
| 12 | Open PR from `staging` to `main` | 🔴 Manual |
| 13 | CI runs (lint + test + build only — no E2E rerun) | ✅ Automated |
| 14 | Merge PR into `main` | 🔴 Manual |
| 15 | `Promote to Production` triggers; GitHub pauses for production environment approval | ✅ Automated trigger / 🔴 Manual approval |
| 16 | Approve in GitHub → both apps deploy to Vercel production | 🔴 Manual approval → ✅ Automated |

## 6. Post-Merge Staging Alias Behavior

`staging-alias-sync.yml` fires on every push to `staging` (i.e., after every merge). It performs the following steps:

1. **Deploys** both client and server from the merged `staging` HEAD.
2. **Captures** the current alias targets before attempting cutover.
3. **Assigns** the new deployment to `VERCEL_STAGING_ALIAS_CLIENT` and `VERCEL_STAGING_ALIAS_SERVER`.
4. **Rollback on partial failure**: If the server alias assignment fails after the client alias succeeded, the client alias is automatically rolled back to its previous target.
5. **Hard failure**: If no previous target exists for rollback, the workflow fails hard with a manual intervention warning.

The stable staging URLs are the canonical review targets for the `staging → main` PR.

## 7. Vercel Quota Protection

`vercel-preview-on-main.yml` fires on PRs to `e2e-testing` or `staging` (not on every push). The `Preflight — Secret Validation` job ensures no deployment runs when secrets are missing or the PR is from a fork. This means broken or unauthorized code never consumes a Vercel deployment slot.

Additionally, E2E tests run against the preview URL rather than a separate deployment, so no extra Vercel build is triggered for testing.

## 8. Rollback

### Option A — Revert through the pipeline

Revert the bad commit on `main` and merge the revert through the normal `staging → main` path. Alternatively, for faster rollback, use the emergency manual workflow (Option B).

### Option B — Use the fallback `vercel-promote-production.yml` (manual)

1. Go to **GitHub → Actions → Promote Vercel Preview to Production → Run workflow**.
2. Enter the explicit `client_deployment_url` and `server_deployment_url` (deployment URL or ID from Vercel dashboard).
3. Run. Approval gate still applies.

This is the safest rollback path when you know the exact deployment ID of the last good version.

### Option C — Via Vercel dashboard

1. Open **Vercel Dashboard → Project → Deployments**.
2. Find the previous production deployment.
3. Click **Promote to Production** directly in the UI.

Repeat for both `ichnos-client` and `ichnos-server`. No GitHub Actions run is required.
