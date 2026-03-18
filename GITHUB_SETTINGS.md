# GitHub Repository Settings Reference

Complete configuration guide for the Ichnos Protocol GitHub repository. This document assumes the repository may have been previously configured with different settings (e.g., a 4-branch model, staging branches, or different status checks) and walks through a clean setup from scratch.

> **This is the authoritative source** for GitHub repository settings. [`DEPLOYMENT_GITHUB_ACTIONS.md`](DEPLOYMENT_GITHUB_ACTIONS.md) references this file for quick-reference summaries.

---

## Overview — What Must Be Configured

The GitHub repository requires the following settings to support the 2-branch deployment model (`feature/* → main → release`):

| Area                      | What                                                                                    | Why                                                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Repository Secrets**    | 10 secrets for CI/E2E + 4 additional secrets for production promotion (14 total)        | CI/E2E workflows need Neon DB access and test accounts; production promotion workflows need Vercel API access               |
| **Repository Variables**  | 1 variable for CI/E2E (`NEON_PROJECT_ID`)                                               | E2E workflows reference `vars.NEON_PROJECT_ID` for Neon branch operations                                                   |
| **Environments**          | `production` environment with required reviewers                                        | Production promotion workflow pauses for human approval before deploying                                                    |
| **Branch Protections**    | `main` (5 required checks + PR required) and `release` (1 required check + PR required) | Enforces the CI → Preview → E2E → merge pipeline and the `main`-only release policy                                         |
| **Old Rule Cleanup**      | Remove stale branch protections and rulesets from previous configurations               | Stale rules (e.g., for `staging`, `e2e-testing`, or different check names) can block merges or silently bypass the pipeline |
| **Auto-Merge** (optional) | Allow auto-merge at the repository level                                                | Enables automatic merge of `main → release` PRs once the `Release Policy Check` passes                                      |

---

## 1. Clean Up Old Rules

If this repository was previously configured with different branch protections (e.g., a 4-branch model with `staging` or `e2e-testing` branches), clean up stale rules first. **Skip this section for a fresh repository.**

### Step 1 — Remove stale branch protection rules

1. Go to **Settings → Branches**.
2. For each existing branch protection rule, check whether the **Branch name pattern** matches a branch that no longer exists in the 2-branch model (e.g., `staging`, `e2e-testing`, `develop`).
3. Delete any rule that does not apply to `main` or `release`.

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

### Neon DB Secrets (ephemeral E2E branches)

| Secret         | Description                                 | Where to Find                  |
| -------------- | ------------------------------------------- | ------------------------------ |
| `NEON_API_KEY` | Neon API key for creating/deleting branches | Neon Tech → Account → API Keys |

> **Note:** The `DATABASE_URL` secret is **no longer used** by the E2E workflow. Each run provisions an ephemeral Neon DB branch automatically. You may remove `DATABASE_URL` from repository secrets if no other workflow references it.

> **Repository variable required:** `NEON_PROJECT_ID` must be configured as a repository variable (not a secret) and is referenced in workflows via `vars.NEON_PROJECT_ID`. Both `NEON_API_KEY` and `NEON_PROJECT_ID` are auto-provisioned by the Neon GitHub Integration, so no manual setup is required.

### E2E Test Account Secrets

Three test accounts are required for Playwright E2E tests. Each account must be pre-created in Firebase Authentication.

| Secret                     | Description                            |
| -------------------------- | -------------------------------------- |
| `E2E_ADMIN_EMAIL`          | Admin test account email               |
| `E2E_ADMIN_PASSWORD`       | Admin test account password            |
| `E2E_ADMIN_UID`            | Admin test account Firebase UID        |
| `E2E_USER_EMAIL`           | Regular user test account email        |
| `E2E_USER_PASSWORD`        | Regular user test account password     |
| `E2E_USER_UID`             | Regular user test account Firebase UID |
| `E2E_SUPER_ADMIN_EMAIL`    | Super-admin test account email         |
| `E2E_SUPER_ADMIN_PASSWORD` | Super-admin test account password      |
| `E2E_SUPER_ADMIN_UID`      | Super-admin test account Firebase UID  |

### Production Promotion Secrets

These 4 secrets are **required** for the production promotion workflows (`promote-to-production.yml` and `vercel-promote-production.yml`). They are not needed for preview deployments (handled by Vercel's native Git integration) or for CI/E2E workflows.

| Secret                     | Description                             | Where to Find                                    |
| -------------------------- | --------------------------------------- | ------------------------------------------------ |
| `VERCEL_TOKEN`             | Vercel API token for CLI and API access | Vercel → Account Settings → Tokens               |
| `VERCEL_ORG_ID`            | Vercel team/org ID                      | Vercel → Team Settings → General → Team ID       |
| `VERCEL_PROJECT_ID_CLIENT` | Vercel project ID for the client app    | Vercel → Project Settings → General → Project ID |
| `VERCEL_PROJECT_ID_SERVER` | Vercel project ID for the server app    | Vercel → Project Settings → General → Project ID |

> **Without these 4 secrets, merging into `release` will trigger `promote-to-production.yml` which will fail.** If you only need preview deployments and CI/E2E (no production promotion via GitHub Actions), you can omit these secrets and promote manually via the Vercel dashboard instead.

---

## 3. Environments

### Create the `production` environment

1. Go to **Settings → Environments → New environment**.
2. Name it exactly `production`.
3. Under **Deployment protection rules**, enable **Required reviewers** and add at least one reviewer.
4. Save.

> Both `promote-to-production.yml` and `vercel-promote-production.yml` target `environment: production`. Without this environment configured, promotions run without approval — which defeats the purpose of the gate.

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
> - **`E2E Tests (Playwright)`**: Produced by `e2e-on-preview.yml`. Triggered by `deployment_status` events after Vercel completes a preview deployment. For client deployments, Playwright tests execute. For server deployments, the job succeeds immediately without running tests — this is intentional so the required status check is satisfied for both deployment events. See [`DEPLOYMENT_GITHUB_ACTIONS.md`](DEPLOYMENT_GITHUB_ACTIONS.md) §3 for full hostname-based routing details.

### `release` branch

| Setting                               | Value                  |
| ------------------------------------- | ---------------------- |
| Require a pull request before merging | Yes                    |
| Required status checks                | `Release Policy Check` |
| Include administrators                | Recommended            |

> **Important:** GitHub Actions check names are frozen in workflow file headers (the `name:` field of each job). Do not rename jobs in workflow YAML without updating the corresponding branch protection rules here. `E2E Tests (Playwright)` is produced by `e2e-on-preview.yml`. Vercel check names are determined by your Vercel project names — always copy the exact context string from a recent PR's checks tab before configuring branch protection rules.

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
| `NEON_PROJECT_ID` variable                               | Set, non-empty                                     | Settings → Secrets and variables → Actions → Variables |
| `NEON_API_KEY` secret                                    | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `E2E_ADMIN_EMAIL` secret                                 | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `E2E_ADMIN_PASSWORD` secret                              | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `E2E_ADMIN_UID` secret                                   | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `E2E_USER_EMAIL` secret                                  | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `E2E_USER_PASSWORD` secret                               | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `E2E_USER_UID` secret                                    | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `E2E_SUPER_ADMIN_EMAIL` secret                           | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `E2E_SUPER_ADMIN_PASSWORD` secret                        | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `E2E_SUPER_ADMIN_UID` secret                             | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `VERCEL_TOKEN` secret (production promotion)             | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `VERCEL_ORG_ID` secret (production promotion)            | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `VERCEL_PROJECT_ID_CLIENT` secret (production promotion) | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `VERCEL_PROJECT_ID_SERVER` secret (production promotion) | Set, non-empty                                     | Settings → Secrets → Actions                           |
| `production` environment                                 | Exists with ≥1 required reviewer                   | Settings → Environments                                |
| `main` branch protection                                 | PR required + 5 status checks                      | Settings → Branches (or Rules → Rulesets)              |
| `release` branch protection                              | PR required + `Release Policy Check`               | Settings → Branches (or Rules → Rulesets)              |
| Include administrators (`main`)                          | Enabled                                            | Settings → Branches → `main` rule                      |
| Include administrators (`release`)                       | Enabled                                            | Settings → Branches → `release` rule                   |
| Stale branch protections                                 | None (no rules for `staging`, `e2e-testing`, etc.) | Settings → Branches                                    |
| Stale rulesets                                           | None (no rulesets referencing removed branches)    | Settings → Rules → Rulesets                            |
| Auto-merge (optional)                                    | Enabled at repo level                              | Settings → General                                     |

---

## Copy-Paste Setup Checklist

Use this checklist when setting up a new repository or verifying an existing one:

- [ ] **Old rules cleaned up** — No stale branch protections or rulesets from previous configurations (§1)
- [ ] **Secrets (CI/E2E)** — All 10 CI/E2E secrets are set (§2)
  - [ ] `NEON_API_KEY`
  - [ ] `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` / `E2E_ADMIN_UID`
  - [ ] `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` / `E2E_USER_UID`
  - [ ] `E2E_SUPER_ADMIN_EMAIL` / `E2E_SUPER_ADMIN_PASSWORD` / `E2E_SUPER_ADMIN_UID`
- [ ] **Repository variable (CI/E2E)** — `NEON_PROJECT_ID` is set in repository variables and referenced as `vars.NEON_PROJECT_ID` (§2)
- [ ] **Secrets (production promotion)** — All 4 Vercel secrets are set if using `promote-to-production.yml` or `vercel-promote-production.yml` (§2)
  - [ ] `VERCEL_TOKEN`
  - [ ] `VERCEL_ORG_ID`
  - [ ] `VERCEL_PROJECT_ID_CLIENT`
  - [ ] `VERCEL_PROJECT_ID_SERVER`
- [ ] **Environment** — `production` environment exists with at least one required reviewer (§3)
- [ ] **Branch protection: `main`** — 5 required status checks configured: `Client — Lint & Test`, `Server — Lint & Test`, the two Vercel deployment checks (copy exact names from a recent PR's check list), `E2E Tests (Playwright)` (§4)
- [ ] **Branch protection: `release`** — `Release Policy Check` required + PR required (§4)
- [ ] **Admin bypass** — "Include administrators" enabled on both branches (§6)
- [ ] **Verification matrix** — All rows confirmed (§Verification Matrix)
