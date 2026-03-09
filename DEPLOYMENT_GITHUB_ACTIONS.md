# GitHub Actions Deployment Flow (Preview First, Manual Production)

This repository now supports a two-step Vercel release model:

1. Every merge to `main` creates fresh **Preview** deployments for `client/` and `server/`.
2. Production is updated only when you manually run a promotion workflow after review.

## Workflows Added

- `.github/workflows/vercel-preview-on-main.yml`
  - Trigger: `push` on `main`
  - Action: builds and deploys `client/` and `server/` to Vercel **Preview**
- `.github/workflows/vercel-promote-production.yml`
  - Trigger: manual (`workflow_dispatch`)
  - Action: promotes selected Vercel preview deployments to **Production**

## One-Time Setup in Vercel

You must stop `main` from being a production branch.

1. Open Vercel project settings for `ichnos-client`.
2. Go to Git settings.
3. Change `Production Branch` from `main` to a branch you do not use for normal merges (example: `release`).
4. Repeat for `ichnos-server`.

Result: merges to `main` produce preview deployments only, while production requires explicit promotion.

## One-Time Setup in GitHub

Create these repository secrets in GitHub:

- `VERCEL_TOKEN`: Personal or team token from Vercel.
- `VERCEL_ORG_ID`: Vercel team/org ID.
- `VERCEL_PROJECT_ID_CLIENT`: Project ID for `ichnos-client`.
- `VERCEL_PROJECT_ID_SERVER`: Project ID for `ichnos-server`.

Where to find IDs:

- Vercel Dashboard -> Project -> Settings -> General -> Project ID.
- Vercel Dashboard -> Team Settings -> General -> Team ID.

## Optional but Recommended Approval Gate

Use a protected GitHub environment so production promotion requires human approval.

1. GitHub repository -> Settings -> Environments -> New environment.
2. Name it `production`.
3. Add `Required reviewers`.
4. Save.

The `vercel-promote-production.yml` workflow already targets `environment: production`.

## Daily Usage

### Step 1: Merge PR into `main`

When a PR is merged:

- `vercel-preview-on-main.yml` runs automatically.
- It deploys both apps to preview.
- Deployment URLs are shown in the workflow `Summary` section.

### Step 2: Review the preview

Validate:

- Public pages
- Admin flows
- API behavior
- E2E checks (if applicable)

### Step 3: Promote to production manually

1. Open GitHub -> Actions -> `Promote Vercel Preview to Production`.
2. Click `Run workflow`.
3. Fill inputs:
   - `client_deployment_url`
   - `server_deployment_url`
4. Run.
5. If `production` environment protection is enabled, approver confirms before promotion executes.

## Notes

- Promotion is atomic per workflow run: client and server are both promoted in one run.
- Use deployment URLs/IDs from Vercel or from the preview workflow summary.
- If one promotion step fails, rerun the workflow with corrected input.

## Rollback

To roll back production quickly:

1. Open Vercel deployments history.
2. Choose the previous known-good deployment for each project.
3. Run the manual promotion workflow again using those previous deployment URLs/IDs.
