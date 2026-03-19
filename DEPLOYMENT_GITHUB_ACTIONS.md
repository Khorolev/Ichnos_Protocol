# GitHub Actions Deployment Pipeline

This repository uses a **2-branch deployment model**: `feature/* → main → release`. No code reaches Vercel production without passing CI, E2E tests, and a human approval gate. Preview deployments are handled by **Vercel's native Git integration** — every push to a branch or PR automatically creates a preview deployment without any GitHub Actions workflow involvement. E2E tests run on every PR targeting `main`, and merge is blocked until all required checks pass.

## 1. Pipeline Overview

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub Actions
    participant CI as CI Jobs (Lint + Test)
    participant Vercel as Vercel Git Integration
    participant DS as repository_dispatch (vercel.deployment.success)
    participant E2E as e2e.yml
    participant PW as Playwright
    participant RPC as Release Policy Check
    participant Prod as Vercel Production

    Dev->>GH: Open PR from feature/* to main
    GH->>CI: Trigger Client — Lint & Test and Server — Lint & Test (parallel)
    Dev->>Vercel: Push to branch / open PR
    Vercel->>Vercel: Build and deploy preview (client + server, automatic)
    Vercel->>GH: Emit Vercel check status (build success/failure)
    Vercel->>DS: Emit repository_dispatch (vercel.deployment.success) for each app
    DS->>E2E: Trigger E2E Tests (Playwright) job
    E2E->>E2E: Classify target_url hostname
    alt Client hostname (custom / git / hash)
        E2E->>PW: Run Playwright tests against client URL
        PW-->>GH: ✅ E2E passes — required status check for merge
    else Server hostname (custom / git / hash)
        E2E-->>GH: ✅ Intentional skip (server event) — check still emitted
    else Unknown hostname
        E2E->>PW: Fail open — run Playwright tests (ambiguous target)
    end
    CI-->>GH: ✅ CI passes
    Dev->>GH: Merge PR into main (all 5 checks pass)

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

| Workflow file                   | Name                                 | Trigger                      | Purpose                                                                                                                                 |
| ------------------------------- | ------------------------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`                        | CI                                   | `pull_request` to `main`     | Lint + unit tests + client build verification                                                                                           |
| `e2e.yml`                       | E2E Tests (Playwright)               | `repository_dispatch (vercel.deployment.success)` + `workflow_dispatch` (manual) | Run E2E for client hostnames (custom domain, git-branch preview, hash-based preview); skip server hostnames; fail-open on ambiguous hostnames. Also supports ad-hoc runs via `workflow_dispatch` with a provided `base_url` |
| `promote-to-production.yml`     | Promote to Production                | `push` to `release`          | Discover latest READY `main` preview → promote to production (approval-gated)                                                           |
| `release-policy-check.yml`      | Release Policy Check                 | `pull_request` to `release`  | Fails if PR head branch is not `main`                                                                                                   |

> **Note:** Preview deployments are **not** managed by any GitHub Actions workflow. They are created automatically by Vercel's native Git integration whenever code is pushed to a branch or a PR is opened.

## 3. E2E Hostname-Based Target Detection

E2E tests are triggered by **`repository_dispatch (vercel.deployment.success)`** events via `e2e.yml`. When Vercel's native Git integration completes a Preview deployment, a `repository_dispatch` event is emitted containing the deployment URL. The workflow classifies this URL by hostname to decide what action to take:

Three detection families are used — custom domains, git-branch auto-preview URLs, and hash-based auto-preview URLs:

| Hostname pattern in deployment URL                                                      | Type                | Action                                                | Rationale                                                                                              |
| --------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `staging-client.ichnos-protocol.com`                                                    | Custom domain       | Run Playwright tests                                  | Client deployment — the E2E target                                                                     |
| `staging-api.ichnos-protocol.com`                                                       | Custom domain       | Intentional skip (job succeeds without running tests) | Server deployment — no browser tests needed                                                            |
| `ichnos-protocol-server-git-*` or `ichnos-protocolserver-git-*`                         | Auto-preview (git)  | Intentional skip (job succeeds without running tests) | Server feature-branch preview — no browser tests needed (both slug variants matched for compatibility) |
| `ichnos-protocol-git-*` (excluding server variants above)                               | Auto-preview (git)  | Run Playwright tests                                  | Client feature-branch preview — E2E target                                                             |
| `ichnos-protocolserver-*-khorolevs-projects.vercel.app`                                 | Auto-preview (hash) | Intentional skip (job succeeds without running tests) | Server hash-based preview — no browser tests needed                                                    |
| `ichnos-protocol-*-khorolevs-projects.vercel.app` (excluding `ichnos-protocolserver-*`) | Auto-preview (hash) | Run Playwright tests                                  | Client hash-based preview — E2E target                                                                 |
| `*.vercel.app`, `ichnos-protocol.com`, `*.ichnos-protocol.com`                          | Production          | Intentional skip                                      | Production deployments do not trigger E2E                                                              |
| Any other hostname                                                                      | —                   | Fail open (run tests)                                 | Ambiguous deployment — run tests to avoid blocking merges on unexpected but potentially valid patterns |

**Key details:**

- Detection uses deployment URL hostname pattern matching, **not** `VERCEL_PROJECT_ID_CLIENT` or any other secret. Hostname routing is the source of truth for E2E target classification.
- The server auto-preview patterns (`ichnos-protocol-server-git-*` and `ichnos-protocolserver-git-*`) are checked **before** the client auto-preview pattern (`ichnos-protocol-git-*`) to prevent false positives, since both server patterns are subsets of the client pattern. Similarly, the server hash pattern (`ichnos-protocolserver-*`) is checked before the client hash pattern (`ichnos-protocol-*`).
- Both client and server Preview deployments emit the `E2E Tests (Playwright)` check context. The server path succeeds immediately without executing tests — this is intentional so the required status check is satisfied for both deployment events.
- Preview vs production routing is handled entirely by hostname matching inside the "Validate deployment target" step.
- Note: The Vercel server project slug is `ichnos-protocolserver` (no hyphen before "server"), which affects both `-git-` and hash-based hostname patterns.

## 4. E2E Troubleshooting

When investigating E2E check results, use this table to interpret the status:

| Check Status                                     | Meaning                                                                                                                                                                                                             | Action                                                                                                                          |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Passed** (client hostname)                     | Playwright tests executed and passed                                                                                                                                                                                | No action needed                                                                                                                |
| **Skipped** (server hostname)                    | Server deployment event (`staging-api.ichnos-protocol.com`, `ichnos-protocol-server-git-*`, `ichnos-protocolserver-git-*`, or `ichnos-protocolserver-*-khorolevs-projects.vercel.app`); tests intentionally skipped | No action needed — this is expected behavior                                                                                    |
| **Ran** — ambiguous hostname                     | Hostname in deployment URL did not match any expected pattern; tests ran anyway (fail-open policy)                                                                                                                   | Check if Vercel domain or project naming changed; verify deployment URL and extracted hostname in the workflow run logs          |
| **Failed** — Playwright test failure             | Tests executed against the client deployment and failed                                                                                                                                                             | Check the Playwright HTML report artifact uploaded to the workflow run                                                          |
| **Cancelled**                                    | Workflow run was cancelled mid-execution                                                                                                                                                                            | Re-run the workflow or push a new commit to trigger a fresh deployment                                                          |

**First debugging step:** Open the **Job summary** tab in the GitHub Actions run for `e2e.yml`. It shows deployment URL, hostname classification result, and step outcomes in a compact table.

## 5. One-Time Setup — GitHub

Full GitHub repository settings — secrets, environments, branch protections, auto-merge, and fork policy — are documented in [`GITHUB_SETTINGS.md`](GITHUB_SETTINGS.md). Follow that guide from top to bottom for initial setup or to verify an existing configuration.

### Required secrets summary

Kept here for quick reference. [`GITHUB_SETTINGS.md`](GITHUB_SETTINGS.md) is the authoritative source.

#### CI and E2E secrets (10)

| Secret                                                                       | Purpose                                                                               |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `E2E_SEED_TOKEN`                                                             | Bearer token for POST /api/e2e/seed on the preview server (Preview scope only in Vercel; repo secret in GitHub) |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` / `E2E_ADMIN_UID`                   | Admin test account                                                                    |
| `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` / `E2E_USER_UID`                      | Regular user test account                                                             |
| `E2E_SUPER_ADMIN_EMAIL` / `E2E_SUPER_ADMIN_PASSWORD` / `E2E_SUPER_ADMIN_UID` | Super-admin test account                                                              |

These secrets are sufficient for CI, E2E, and preview deployments. Preview deployments are handled entirely by Vercel's native Git integration — no Vercel API tokens or project IDs are needed.

#### Production promotion secrets (4)

| Secret                     | Purpose                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| `VERCEL_TOKEN`             | Vercel API token — used by `promote-to-production.yml`  |
| `VERCEL_ORG_ID`            | Vercel team/org ID — used by `promote-to-production.yml` |
| `VERCEL_PROJECT_ID_CLIENT` | Vercel project ID for the client app — used by `promote-to-production.yml` |
| `VERCEL_PROJECT_ID_SERVER` | Vercel project ID for the server app — used by `promote-to-production.yml` |

These 4 secrets are **required** for production promotion via GitHub Actions. Without them, merging into `release` will trigger `promote-to-production.yml` which will fail. If you prefer to promote manually via the Vercel dashboard, you can omit these secrets.

### Required checks per branch

| Target branch | Required status checks                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `main`        | `Client — Lint & Test`, `Server — Lint & Test`, `<your-client-vercel-check>`, `<your-server-vercel-check>`, `E2E Tests (Playwright)` |
| `release`     | `Release Policy Check` + require a pull request before merging                                                                       |

> **Note:** The `E2E Tests (Playwright)` check name is produced by `e2e.yml` (job name: `E2E Tests (Playwright)`). The Vercel checks are produced by Vercel's native Git integration — **their exact names depend on your Vercel project names** (e.g., `Vercel – ichnos-protocol`, `Vercel – ichnos-protocol-server`). To find the correct names: open a recent PR, scroll to the status checks section, and copy the exact Vercel check context strings. A mismatch between the configured required check name and the actual check context will block all merges. GitHub Actions check names are frozen in workflow file headers — do not rename jobs without updating branch protection rules. See [`GITHUB_SETTINGS.md`](GITHUB_SETTINGS.md) §4 for step-by-step configuration.

## 6. One-Time Setup — Vercel

Full Vercel project settings — production branch, environment variables, old alias cleanup, and token/ID lookup — are documented in [`VERCEL_SETTINGS.md`](VERCEL_SETTINGS.md). Follow that guide for both `ichnos-client` and `ichnos-server`.

Two critical invariants to maintain:

- **Vercel production branch must be `release`** on both projects (not `main`).
- **Vercel Git integration must remain enabled** — preview deployments are created automatically on branch pushes and PRs. This is the default Vercel behavior; do not add `"git": { "deploymentEnabled": false }` to `vercel.json` files.

## 7. Daily Developer Workflow

### Feature → main (PR-gated)

| Step | Action                                                                                               | Status                                |
| ---- | ---------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 1    | Create `feature/<name>` from `main`; open PR targeting `main`                                        | 🔴 Manual                             |
| 2    | CI runs: lint + test + build (client and server)                                                     | ✅ Automated                          |
| 3    | Vercel automatically creates preview deployments for both client and server                          | ✅ Automated (native Git integration) |
| 4    | Vercel emits `repository_dispatch (vercel.deployment.success)` events; `e2e.yml` runs `E2E Tests (Playwright)` for each | ✅ Automated                          |
| 5    | All 5 required checks pass — PR is mergeable                                                         | ✅ Automated gate                     |
| 6    | Merge PR into `main`                                                                                 | 🔴 Manual                             |

### main → release (production promotion)

| Step | Action                                                                                 | Status                                    |
| ---- | -------------------------------------------------------------------------------------- | ----------------------------------------- |
| 7    | Open PR from `main` to `release`                                                       | 🔴 Manual                                 |
| 8    | `Release Policy Check` runs — fails if head branch is not `main`                       | ✅ Automated gate                         |
| 9    | Merge PR into `release`                                                                | 🔴 Manual                                 |
| 10   | `Promote to Production` triggers; GitHub pauses for `production` environment approval  | ✅ Automated trigger / 🔴 Manual approval |
| 11   | Approve → workflow discovers latest READY `main` preview and promotes it to production | 🔴 Manual approval → ✅ Automated         |

## 8. Vercel Quota Protection

Preview deployments are managed by Vercel's native Git integration, which builds on every push. E2E tests run against the preview URL emitted via `repository_dispatch (vercel.deployment.success)`, so no extra Vercel build is triggered for testing.

Fork PRs do not receive preview deployments with secrets because Vercel's Git integration does not expose environment variables to builds from forks by default.

## 9. Rollback

### Option A — Revert through the pipeline

Revert the bad commit on `main`, open a new `main → release` PR, and promote through the normal pipeline.

### Option B — Via Vercel dashboard

1. Open **Vercel Dashboard → Project → Deployments**.
2. Find the previous production deployment.
3. Click **Promote to Production** directly in the UI.

Repeat for both `ichnos-client` and `ichnos-server`. No GitHub Actions run is required.
