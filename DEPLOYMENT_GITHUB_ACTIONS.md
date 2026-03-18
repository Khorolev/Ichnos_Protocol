# GitHub Actions Deployment Pipeline

This repository uses a **2-branch deployment model**: `feature/* → main → release`. No code reaches Vercel production without passing CI, E2E tests, and a human approval gate. Preview deployments and E2E tests run on every PR targeting `main`, and merge is blocked until all required checks pass.

## 1. Pipeline Overview

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub Actions
    participant CI as CI Jobs (Lint + Test)
    participant PF as Preflight — Secret Validation
    participant VP as Vercel Preview (deploy jobs)
    participant DS as GitHub deployment_status
    participant E2E as e2e-on-preview.yml
    participant PW as Playwright
    participant RPC as Release Policy Check
    participant Prod as Vercel Production

    Dev->>GH: Open PR from feature/* to main
    GH->>CI: Trigger Client — Lint & Test and Server — Lint & Test (parallel)
    GH->>PF: Preflight validates all secrets; fork PRs hard-blocked
    CI-->>GH: ✅ CI passes
    PF-->>VP: Secrets valid → deploy both apps to preview (parallel)
    VP-->>DS: Vercel emits deployment_status (success, Preview) for each app
    DS->>E2E: Trigger E2E Tests (Playwright) job
    E2E->>E2E: Classify target_url hostname
    alt staging-client.ichnos-protocol.com OR ichnos-protocol-git-*
        E2E->>PW: Run Playwright tests against client URL
        PW-->>GH: ✅ E2E passes — required status check for merge
    else staging-api.ichnos-protocol.com OR ichnos-protocol-server-git-*
        E2E-->>GH: ✅ Intentional skip (server event) — check still emitted
    else Unknown hostname
        E2E-->>GH: ❌ Fail fast — unexpected deployment target
    end
    Dev->>GH: Merge PR into main

    Dev->>GH: Open PR from main to release
    GH->>RPC: Release Policy Check — fails if head branch is not main
    RPC-->>GH: ✅ Policy check passes
    Dev->>GH: Merge PR into release
    GH->>Prod: Promote to Production triggers
    GH-->>Dev: Awaiting approval (production environment) 🔴
    Dev->>GH: Approve 🔴
    GH->>Prod: Discover latest READY main preview → promote to production
```

## 2. Workflows

| Workflow file | Name | Trigger | Purpose |
|---|---|---|---|
| `vercel-preview-on-main.yml` | Vercel Preview | `pull_request` to `main` | CI + preflight + deploy both apps to preview |
| `e2e-on-preview.yml` | E2E Tests on Preview | `deployment_status` | Run E2E for client hostnames (custom domain + auto-preview URL); skip server hostnames; fail-fast unknown hostname |
| `promote-to-production.yml` | Promote to Production | `push` to `release` | Discover latest READY `main` preview → promote to production (approval-gated) |
| `release-policy-check.yml` | Release Policy Check | `pull_request` to `release` | Fails if PR head branch is not `main` |
| `vercel-promote-production.yml` | Promote Vercel Preview to Production | `workflow_dispatch` (manual) | Emergency/manual promotion via explicit deployment URL inputs |
| `e2e.yml` | E2E Tests (Playwright) | `workflow_dispatch` (manual) | Ad-hoc Playwright diagnostics against a provided `base_url` |

## 3. E2E Hostname-Based Target Detection

E2E tests are triggered by **GitHub `deployment_status` events** via `e2e-on-preview.yml`. When Vercel completes a Preview deployment, GitHub emits a `deployment_status` event containing a `target_url`. The workflow classifies this URL by hostname to decide what action to take:

Two detection families are used — custom domains and Vercel auto-preview URLs:

| Hostname pattern in `target_url` | Type | Action | Rationale |
|---|---|---|---|
| `staging-client.ichnos-protocol.com` | Custom domain | Run Playwright tests | Client deployment — the E2E target |
| `ichnos-protocol-git-*` (excluding `ichnos-protocol-server-git-*`) | Auto-preview URL | Run Playwright tests | Client feature-branch preview — E2E target |
| `staging-api.ichnos-protocol.com` | Custom domain | Intentional skip (job succeeds without running tests) | Server deployment — no browser tests needed |
| `ichnos-protocol-server-git-*` | Auto-preview URL | Intentional skip (job succeeds without running tests) | Server feature-branch preview — no browser tests needed |
| Any other hostname | — | Fail fast (`exit 1`) | Unexpected deployment — flag for investigation |

**Key details:**

- Detection uses `deployment_status.target_url` hostname pattern matching, **not** `VERCEL_PROJECT_ID_CLIENT` or any other secret. Hostname routing is the source of truth for E2E target classification.
- The server auto-preview pattern (`ichnos-protocol-server-git-*`) is checked **before** the client auto-preview pattern (`ichnos-protocol-git-*`) to prevent false positives, since the server pattern is a subset of the client pattern.
- Both client and server Preview deployments emit the `E2E Tests (Playwright)` check context. The server path succeeds immediately without executing tests — this is intentional so the required status check is satisfied for both deployment events.
- The job-level `if` condition filters on `deployment_status.state == 'success'` and `deployment.environment == 'Preview'` before hostname classification occurs.

## 4. E2E Troubleshooting

When investigating E2E check results, use this table to interpret the status:

| Check Status | Meaning | Action |
|---|---|---|
| **Passed** (client hostname) | Playwright tests executed and passed | No action needed |
| **Skipped** (server hostname) | Server deployment event (`staging-api.ichnos-protocol.com` or `ichnos-protocol-server-git-*`); tests intentionally skipped | No action needed — this is expected behavior |
| **Failed** — "unknown deployment target pattern" | Hostname in `target_url` did not match any expected pattern (custom domains or auto-preview URL patterns) | Check if Vercel domain or project naming changed; verify `target_url` and extracted hostname in the workflow run logs |
| **Failed** — Playwright test failure | Tests executed against the client deployment and failed | Check the Playwright HTML report artifact uploaded to the workflow run |
| **Cancelled** | Workflow run was cancelled mid-execution | Re-run the workflow or push a new commit to trigger a fresh deployment |

**First debugging step:** Open the **Job summary** tab in the GitHub Actions run for `e2e-on-preview.yml`. It shows `target_url`, hostname classification result, and step outcomes in a compact table.

## 5. One-Time Setup — GitHub

Full GitHub repository settings — secrets, environments, branch protections, auto-merge, and fork policy — are documented in [`GITHUB_SETTINGS.md`](GITHUB_SETTINGS.md). Follow that guide from top to bottom for initial setup or to verify an existing configuration.

### Required secrets summary

Kept here for quick reference. [`GITHUB_SETTINGS.md`](GITHUB_SETTINGS.md) is the authoritative source.

| Secret | Purpose |
|---|---|
| `VERCEL_TOKEN` | Authenticates all Vercel CLI calls |
| `VERCEL_ORG_ID` | Org/owner resolution for Vercel CLI |
| `VERCEL_PROJECT_ID_CLIENT` | Targets `ichnos-client` Vercel project |
| `VERCEL_PROJECT_ID_SERVER` | Targets `ichnos-server` Vercel project |
| `DATABASE_URL` | PostgreSQL connection string for E2E seed |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` / `E2E_ADMIN_UID` | Admin test account |
| `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` / `E2E_USER_UID` | Regular user test account |
| `E2E_SUPER_ADMIN_EMAIL` / `E2E_SUPER_ADMIN_PASSWORD` / `E2E_SUPER_ADMIN_UID` | Super-admin test account |

### Required checks per branch

| Target branch | Required status checks |
|---|---|
| `main` | `Client — Lint & Test`, `Server — Lint & Test`, `E2E Tests (Playwright)` |
| `release` | `Release Policy Check` + require a pull request before merging |

> **Note:** The `E2E Tests (Playwright)` check name is produced by `e2e-on-preview.yml` (job name: `E2E Tests (Playwright)`). Check names are frozen in workflow file headers. Do not rename jobs without updating branch protection rules. See [`GITHUB_SETTINGS.md`](GITHUB_SETTINGS.md) §4 for step-by-step configuration.

## 6. One-Time Setup — Vercel

Full Vercel project settings — production branch, environment variables, old alias cleanup, and token/ID lookup — are documented in [`VERCEL_SETTINGS.md`](VERCEL_SETTINGS.md). Follow that guide for both `ichnos-client` and `ichnos-server`.

Two critical invariants to maintain:

- **Vercel production branch must be `release`** on both projects (not `main`).
- **`"git": { "deploymentEnabled": false }`** must remain in both `vercel.json` files — all deployments are workflow-driven.

## 7. Daily Developer Workflow

### Feature → main (PR-gated)

| Step | Action | Status |
|---|---|---|
| 1 | Create `feature/<name>` from `main`; open PR targeting `main` | 🔴 Manual |
| 2 | CI runs: lint + test + build (client and server) | ✅ Automated |
| 3 | `Preflight — Secret Validation` validates secrets; fork PRs hard-blocked | ✅ Automated gate |
| 4 | `Deploy Client Preview` and `Deploy Server Preview` create preview URLs | ✅ Automated |
| 5 | Vercel emits `deployment_status` events; `e2e-on-preview.yml` runs `E2E Tests (Playwright)` for each | ✅ Automated |
| 6 | All 3 required checks pass — PR is mergeable | ✅ Automated gate |
| 7 | Merge PR into `main` | 🔴 Manual |

### main → release (production promotion)

| Step | Action | Status |
|---|---|---|
| 8 | Open PR from `main` to `release` | 🔴 Manual |
| 9 | `Release Policy Check` runs — fails if head branch is not `main` | ✅ Automated gate |
| 10 | Merge PR into `release` | 🔴 Manual |
| 11 | `Promote to Production` triggers; GitHub pauses for `production` environment approval | ✅ Automated trigger / 🔴 Manual approval |
| 12 | Approve → workflow discovers latest READY `main` preview and promotes it to production | 🔴 Manual approval → ✅ Automated |

## 8. Vercel Quota Protection

`vercel-preview-on-main.yml` fires on PRs to `main` (not on every push). The `Preflight — Secret Validation` job ensures no deployment runs when secrets are missing or the PR is from a fork. This means broken or unauthorized code never consumes a Vercel deployment slot.

Additionally, E2E tests run against the preview URL rather than a separate deployment, so no extra Vercel build is triggered for testing.

## 9. Rollback

### Option A — Revert through the pipeline

Revert the bad commit on `main`, open a new `main → release` PR, and promote through the normal pipeline.

### Option B — Use the fallback `vercel-promote-production.yml` (manual)

1. Go to **GitHub → Actions → Promote Vercel Preview to Production → Run workflow**.
2. Enter the explicit `client_deployment_url` and `server_deployment_url` (deployment URL or ID from Vercel dashboard) of the last known-good deployment.
3. Run. Approval gate still applies.

This is the safest rollback path when you know the exact deployment ID of the last good version.

### Option C — Via Vercel dashboard

1. Open **Vercel Dashboard → Project → Deployments**.
2. Find the previous production deployment.
3. Click **Promote to Production** directly in the UI.

Repeat for both `ichnos-client` and `ichnos-server`. No GitHub Actions run is required.
