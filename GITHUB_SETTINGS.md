# GitHub Repository Settings Reference

Complete configuration guide for the Ichnos Protocol GitHub repository. This document assumes the repository may have been previously configured with different settings (e.g., a 4-branch model, staging branches, or different status checks) and walks through a clean setup from scratch.

> **This is the authoritative source** for GitHub repository settings. [`DEPLOYMENT_GITHUB_ACTIONS.md`](DEPLOYMENT_GITHUB_ACTIONS.md) references this file for quick-reference summaries.

---

## Overview — What Must Be Configured

The GitHub repository requires the following settings to support the 3-branch lifecycle (`feature/* → main → release` automated promotion chain, plus `staging` as a parallel manual-QA lane):

| Area                      | What                                                                                    | Why                                                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Repository Secrets**    | 5 secrets for CI/E2E + 4 additional secrets for production promotion (10 total)        | CI/E2E workflows need test account passwords and Vercel bypass; production promotion workflows need Vercel API access |
| **Environments**          | `production` environment with required reviewers                                        | Production promotion workflow pauses for human approval before deploying                                                    |
| **Branch Protections**    | `main` (5 required checks + PR required) and `release` (1 required check + PR required) | Enforces the CI → Preview → E2E → merge pipeline and the `main`-only release policy                                         |
| **Old Rule Cleanup**      | Remove stale branch protections and rulesets from previous configurations               | Stale rules (e.g., for `e2e-testing` or different check names) can block merges or silently bypass the pipeline              |
| **Staging Sync Secret**   | `SYNC_PAT` GitHub Actions secret                                                       | `sync-staging.yml` requires a PAT with `contents: write` to push to `staging` and trigger Vercel redeployment               |
| **Auto-Merge** (optional) | Allow auto-merge at the repository level                                                | Enables automatic merge of `main → release` PRs once the `Release Policy Check` passes                                      |

---

## 1. Clean Up Old Rules

If this repository was previously configured with different branch protections (e.g., a 4-branch model with `staging` or `e2e-testing` branches), clean up stale rules first. **Skip this section for a fresh repository.**

### Step 1 — Remove stale branch protection rules

1. Go to **Settings → Branches**.
2. For each existing branch protection rule, check whether the **Branch name pattern** matches a branch that no longer exists in the current model (e.g., `e2e-testing`, `develop`).
3. Delete any rule that does not apply to `main` or `release`. Note: `staging` is intentionally **unprotected** — it should **not** have a branch protection rule (it is auto-managed by `sync-staging.yml`).

### Step 2 — Remove stale rulesets

1. Go to **Settings → Rules → Rulesets**.
2. Review each ruleset. Delete any that reference branches other than `main` or `release`, or that reference status check names no longer used (e.g., old CI job names).

### Step 3 — Verify no orphan required status checks on `main`

1. Open the existing `main` branch protection rule (or ruleset).
2. Under **Required status checks**, remove any check names that do not match the 5 checks listed in §4 below.
3. Old check names (e.g., `build`, `test`, `ci`, `deploy-preview`) will block all PRs if left in place because no workflow produces them.

> **If you previously had `Preflight — Secret Validation`, `Deploy Client Preview`, or `Deploy Server Preview` as required checks on `main`, these must be removed — no workflow produces these check names anymore. These were from the legacy CLI-driven preview deployment model.**

### Step 4 — Verify no orphan required status checks on `release`

1. Open the existing `release` branch protection rule (or ruleset).
2. The only required status check should be `Release Policy Check`. Remove any others.

---

## 2. Repository Secrets

Navigate to **Settings → Secrets and variables → Actions → New repository secret** and add each secret listed below.

### E2E Test Account Secrets

Three test accounts are required for Playwright E2E tests. Non-sensitive values (emails, UIDs, Firebase API key, URLs) are in the committed `e2e/.env.e2e` file. Only passwords need to be GitHub Secrets. The canonical way to create these accounts and populate their secrets is the provisioning script:

```bash
node e2e/scripts/provision-e2e-firebase-users.js
```

> The root wrapper `node scripts/provision-e2e-firebase-users.js` also works (it delegates to `e2e/scripts/provision-e2e-firebase-users.js`).

This script reads `e2e/.env.e2e`, provisions Firebase users, and syncs passwords to GitHub Secrets and emails/UIDs to Vercel Preview environment variables. The provisioning script is a **local/manual developer/admin tool** — it is not executed by `ci.yml` or `e2e.yml`. CI and E2E workflows consume the synced secrets after the script has run.

After running the script, the following GitHub Actions secrets will be set automatically:

| Secret                             | Description                            |
| ---------------------------------- | -------------------------------------- |
| `E2E_ADMIN_PASSWORD`               | Admin test account password            |
| `E2E_USER_PASSWORD`                | Regular user test account password     |
| `E2E_SUPER_ADMIN_PASSWORD`         | Super-admin test account password      |
| `E2E_MANAGE_ADMIN_TARGET_PASSWORD` | Manage-admin target account password   |

> **Note:** Test account emails, UIDs, and Firebase API key are in the committed `e2e/.env.e2e` file — they are not GitHub Secrets. Firebase UIDs (`E2E_*_UID`) are also synced to Vercel Preview environment variables by the provisioning script (see [`VERCEL_SETTINGS.md`](VERCEL_SETTINGS.md) §2).
>
> **Manual fallback (exception only):** If the provisioning script is unavailable (e.g., missing Firebase service account credentials), you can create the accounts manually in Firebase Console → Authentication → Users and set the 4 password secrets above by hand in Settings → Secrets → Actions. However, the script-based flow is the canonical path and should be used whenever possible.
>
> **Environment note:** Environment and terminal differences can cause the provisioning script to succeed in one shell but fail in another. The script depends on local CLI installation/PATH, `gh` and `vercel` CLI auth state, `server/.vercel/project.json` linkage, and `server/.env` files. For terminal-related errors, first verify: (1) you are in the repo root, (2) `gh auth status`, (3) `vercel whoami`, (4) `cd server && vercel link`.

### Vercel Bypass Secret

This secret is required by `e2e.yml` for Playwright tests to bypass Vercel Deployment Protection.

| Secret                            | Description                                                                   | Where to Find                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Vercel Deployment Protection bypass secret for E2E automation                 | Vercel → Project Settings → Deployment Protection → Protection Bypass for Automation |

> **Note:** `FIREBASE_API_KEY` is no longer a GitHub Secret — it is in the committed `e2e/.env.e2e` file.

### Production Promotion Secrets

These 4 secrets are **required** for the production promotion workflow (`promote-to-production.yml`). They are not needed for preview deployments (handled by Vercel's native Git integration) or for CI/E2E workflows.

| Secret                     | Description                             | Where to Find                                    |
| -------------------------- | --------------------------------------- | ------------------------------------------------ |
| `VERCEL_TOKEN`             | Vercel API token for CLI and API access | Vercel → Account Settings → Tokens               |
| `VERCEL_ORG_ID`            | Vercel team/org ID                      | Vercel → Team Settings → General → Team ID       |
| `VERCEL_PROJECT_ID_CLIENT` | Vercel project ID for the client app    | Vercel → Project Settings → General → Project ID |
| `VERCEL_PROJECT_ID_SERVER` | Vercel project ID for the server app    | Vercel → Project Settings → General → Project ID |

> **Without these 4 secrets, merging into `release` will trigger `promote-to-production.yml` which will fail.** If you only need preview deployments and CI/E2E (no production promotion via GitHub Actions), you can omit these secrets and promote manually via the Vercel dashboard instead.

### Staging Sync Secret

This secret is required by `sync-staging.yml` to force-push `main` to `staging` after every server deployment.

| Secret     | Description                                                                               | Where to Find                                                        |
| ---------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `SYNC_PAT` | Personal Access Token with `contents: write` scope — used to push to `staging` and trigger Vercel redeployment | GitHub → Settings → Developer settings → Personal access tokens (fine-grained or classic) |

> **Why a PAT?** Pushes made with the default `GITHUB_TOKEN` do not trigger Vercel's native Git integration (Vercel ignores events from GitHub Actions bots). A PAT makes the push appear as a real user, which triggers the Vercel preview deployment for the `staging` branch.

### Neon Preview-Branch Cleanup Secrets

These two secrets are required by the `Delete Neon preview branch` step in `e2e.yml`. The step runs with `if: always()` at the end of every E2E workflow run and deletes `preview/{gitBranch}*` Neon branches via the Neon API so they do not accumulate past the project's branch-count limit. Without these secrets the step soft-skips (exit 0) and cleanup falls back to the manual Neon console or Neon's retention policy — the workflow itself still runs normally.

| Secret            | Description                                      | Where to Find                                                                        |
| ----------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `NEON_API_KEY`    | Neon personal or organization API key            | Neon Console → Account Settings → API Keys → Create new API key                      |
| `NEON_PROJECT_ID` | Neon project ID (e.g. `wispy-bar-12345678`)      | Neon Console → Project → Settings → General → Project ID                             |

> **Minimum scope:** The API key needs permission to list and delete branches on the target project. A project-scoped key is preferred over an account-wide key. The key is read only by the `Delete Neon preview branch` step — it is never exposed to test code or the Playwright runner.
>
> **Safety:** The cleanup script (`e2e/scripts/cleanupNeonBranch.js`) refuses to touch `primary` branches, `protected` branches, or any branch literally named `main` / `production` / `staging`. It only targets names matching `preview/{gitBranch}` or `preview/{gitBranch}-*`. See `e2e/scripts/helpers/cleanupNeonBranch.test.js` for the pinned safety contract.

---

## 3. Environments

### Create the `production` environment

1. Go to **Settings → Environments → New environment**.
2. Name it exactly `production`.
3. Under **Deployment protection rules**, enable **Required reviewers** and add at least one reviewer.
4. Save.

> `promote-to-production.yml` targets `environment: production`. Without this environment configured, promotions run without approval — which defeats the purpose of the gate.

---

## 4. Branch Protections

Configure branch protection rules in **Settings → Branches** (or **Settings → Rules → Rulesets**).

### `main` branch

| Setting                                          | Value                                                                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Require a pull request before merging            | Yes                                                                                                                                  |
| Required status checks                           | `Client — Lint & Test`, `Server — Lint & Test`, `<your-client-vercel-check>`, `<your-server-vercel-check>`, `E2E Tests (Playwright)` |
| Require branches to be up to date before merging | Recommended                                                                                                                          |
| Include administrators                           | Recommended (see §6 for trade-offs)                                                                                                  |

> **Required checks explained:**
>
> - **`Client — Lint & Test`** and **`Server — Lint & Test`**: Produced by `ci.yml`. Run linting, unit tests, and client build verification.
> - **Vercel deployment checks** (e.g., `Vercel – ichnos-protocol` and `Vercel – ichnos-protocol-server`): Produced by Vercel's native Git integration. These checks confirm that preview deployments build and deploy successfully. **The exact check names are determined by your Vercel project names and may differ from the examples shown here.** To find the correct names: open a recent PR, scroll to the status checks section, and copy the exact Vercel check context strings. Use those exact strings when configuring required status checks — a mismatch will block all merges.
> - **`E2E Tests (Playwright)`**: Produced by `e2e.yml`, triggered by `repository_dispatch: vercel.deployment.success` events after the **server** Vercel project completes a preview deployment (Repository Dispatch Events are only enabled on the server project). The server is the slower deployment — by the time the dispatch fires, the server is live and the client is already ready. Note that the dispatch signals that the server deployment is live, not that E2E seeding is complete; the `e2e.yml` workflow polls `/api/health` for the `seed.mode` readiness signal to confirm seeding status before running tests. Tests run against the stable E2E URLs from the committed `e2e/.env.e2e` file (`E2E_BASE_URL` / `E2E_API_BASE_URL`). Both trigger modes (`repository_dispatch` and `workflow_dispatch`) resolve targets from this file — the `workflow_dispatch` mode does not accept manual URL inputs. A production-host denylist gate (canonical in `e2e.yml` workflow constants) validates all target URLs before tests run; denylist updates require maintainer-reviewed PRs. The gate is fail-closed — missing/empty denylist constants or unparseable URLs abort the workflow. API readiness is determined by `seed.mode` from `/api/health`: `seeded` or `skipped` → ready; `failed` → immediate failure. See [`DEPLOYMENT_GITHUB_ACTIONS.md`](DEPLOYMENT_GITHUB_ACTIONS.md) §3 for full details.

### `release` branch

| Setting                               | Value                  |
| ------------------------------------- | ---------------------- |
| Require a pull request before merging | Yes                    |
| Required status checks                | `Release Policy Check` |
| Include administrators                | Recommended            |

> **Important:** GitHub Actions check names are frozen in workflow file headers (the `name:` field of each job). Do not rename jobs in workflow YAML without updating the corresponding branch protection rules here. `E2E Tests (Playwright)` is produced by `e2e.yml`. Vercel check names are determined by your Vercel project names — always copy the exact context string from a recent PR's checks tab before configuring branch protection rules.

### `staging` branch

The `staging` branch does **not** have a branch protection rule — this is intentional.

- It is auto-managed by `sync-staging.yml`, which force-pushes `main` to `staging` after every server deployment.
- PRs should **never** target `staging` — it is not a merge target.
- It is a parallel manual-QA lane, not in the `main → release` promotion chain.
- Do not create a branch protection rule for `staging`. A protection rule would block the force-push from `sync-staging.yml`.

> **Production-backed environment (accepted risk):** The `staging` Vercel preview uses **production Firebase** and **production Neon DB** credentials via branch-scoped environment variable overrides (configured in Vercel, not GitHub). Manual QA actions performed on `staging` write directly to the production database — this is explicitly accepted to enable realistic QA. `SKIP_E2E_SEED=true` is set on `staging` to prevent automated E2E seed injection.
>
> **E2E target isolation:** `E2E_BASE_URL` and `E2E_API_BASE_URL` (in the committed `e2e/.env.e2e` file) must point to **ephemeral preview** targets — never to the `staging` branch URL. The staging manual-QA environment and E2E test targets are intentionally separate. Repointing E2E URLs at `staging` would run automated tests against production data.
>
> See [`DEPLOYMENT_GITHUB_ACTIONS.md`](DEPLOYMENT_GITHUB_ACTIONS.md) and [`VERCEL_SETTINGS.md`](VERCEL_SETTINGS.md) for full setup details.

---

## 5. Auto-Merge

Auto-merge can be enabled at the repository level (**Settings → General → Allow auto-merge**) so that PRs are merged automatically once all required checks pass. This is optional but useful for the `main → release` PR flow where the only gate is the `Release Policy Check`.

If enabled:

- The PR author must explicitly enable auto-merge on each PR (it does not happen globally).
- All required status checks must still pass before the merge executes.
- Required reviewers (if configured) must still approve.

---

## 6. Admin Bypass

> **Accepted Limitation**: Branch sequence (`feature/* → main → release`) is enforced via GitHub rulesets and branch protection settings. This provides strong governance enforcement but is **not an absolute, non-bypassable lineage proof** in all edge cases (e.g., a repository admin with bypass permissions could merge out of sequence). This is an explicitly accepted trade-off in favor of platform-native governance over a custom policy-check workflow.

**Recommendation:** Enable "Include administrators" on both `main` and `release` branch protections so that admins cannot accidentally bypass the pipeline. Admins can temporarily disable this setting for emergency hotfixes, but should re-enable it immediately after.

---

## Verification Matrix

After completing setup (or when verifying an existing configuration), confirm every row in this matrix:

| Setting                                                  | Expected State                                     | How to Verify                                          |
| -------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| `E2E_ADMIN_PASSWORD` secret                              | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `E2E_USER_PASSWORD` secret                               | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `E2E_SUPER_ADMIN_PASSWORD` secret                        | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `E2E_MANAGE_ADMIN_TARGET_PASSWORD` secret                | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `VERCEL_AUTOMATION_BYPASS_SECRET` secret                 | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `VERCEL_TOKEN` secret (production promotion)             | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `VERCEL_ORG_ID` secret (production promotion)            | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `VERCEL_PROJECT_ID_CLIENT` secret (production promotion) | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `VERCEL_PROJECT_ID_SERVER` secret (production promotion) | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `NEON_API_KEY` secret (E2E branch cleanup)               | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `NEON_PROJECT_ID` secret (E2E branch cleanup)            | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `production` environment                                 | Exists with ≥1 required reviewer                   | Settings → Environments                                |
| `main` branch protection                                 | PR required + 5 status checks                      | Settings → Branches (or Rules → Rulesets)              |
| `release` branch protection                              | PR required + `Release Policy Check`               | Settings → Branches (or Rules → Rulesets)              |
| Include administrators (`main`)                          | Enabled                                            | Settings → Branches → `main` rule                      |
| Include administrators (`release`)                       | Enabled                                            | Settings → Branches → `release` rule                   |
| `SYNC_PAT` secret                                        | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `staging` branch protection                              | **None** (intentionally unprotected)               | Settings → Branches                                    |
| Stale branch protections                                 | None (no rules for `e2e-testing`, etc.)            | Settings → Branches                                    |
| Stale rulesets                                           | None (no rulesets referencing removed branches)    | Settings → Rules → Rulesets                            |
| Auto-merge (optional)                                    | Enabled at repo level                              | Settings → General                                     |

---

## Copy-Paste Setup Checklist

Use this checklist when setting up a new repository or verifying an existing one:

- [ ] **Old rules cleaned up** — No stale branch protections or rulesets from previous configurations (§1)
- [ ] **Committed config** — `e2e/.env.e2e` exists with non-sensitive E2E config (emails, UIDs, Firebase API key, URLs)
- [ ] **Secrets (CI/E2E)** — All 5 CI/E2E secrets are set (§2)
  - [ ] `E2E_ADMIN_PASSWORD`
  - [ ] `E2E_USER_PASSWORD`
  - [ ] `E2E_SUPER_ADMIN_PASSWORD`
  - [ ] `E2E_MANAGE_ADMIN_TARGET_PASSWORD`
  - [ ] `VERCEL_AUTOMATION_BYPASS_SECRET`
- [ ] **Secrets (production promotion)** — All 4 Vercel secrets are set if using `promote-to-production.yml` (§2)
  - [ ] `VERCEL_TOKEN`
  - [ ] `VERCEL_ORG_ID`
  - [ ] `VERCEL_PROJECT_ID_CLIENT`
  - [ ] `VERCEL_PROJECT_ID_SERVER`
- [ ] **Secret (staging sync)** — `SYNC_PAT` is set (§2)
- [ ] **Secrets (Neon preview cleanup)** — Both set if ephemeral preview branches are desired (§2)
  - [ ] `NEON_API_KEY`
  - [ ] `NEON_PROJECT_ID`
- [ ] **Environment** — `production` environment exists with at least one required reviewer (§3)
- [ ] **Branch protection: `main`** — 5 required status checks configured: `Client — Lint & Test`, `Server — Lint & Test`, the two Vercel deployment checks (copy exact names from a recent PR's check list), `E2E Tests (Playwright)` (§4)
- [ ] **Branch protection: `release`** — `Release Policy Check` required + PR required (§4)
- [ ] **No branch protection on `staging`** — Confirmed intentionally unprotected (§4)
- [ ] **Admin bypass** — "Include administrators" enabled on both branches (§6)
- [ ] **Verification matrix** — All rows confirmed (§Verification Matrix)
