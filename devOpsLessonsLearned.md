# DevOps Lessons Learned — E2E Testing Pipeline

> Hard-won knowledge from setting up Playwright E2E tests against Vercel preview
> deployments with Neon ephemeral databases, Firebase Auth, and GitHub Actions.

---

## 1. Vercel Deployment Protection Blocks Everything

**Problem**: Vercel's Deployment Protection returns `401` on all preview/staging
URLs when accessed without authentication — including from CI runners, curl
health checks, and Playwright browsers.

**What we missed**: Protection applies to **every Vercel project independently**.
In a monorepo with separate client and server projects, you must configure the
bypass secret on **both** projects.

**Where the bypass must be sent**:

| Caller                         | How to send                                                  |
| ------------------------------ | ------------------------------------------------------------ |
| curl (workflow readiness poll) | `-H "x-vercel-protection-bypass: $SECRET"`                   |
| Playwright (browser)           | `extraHTTPHeaders` in `playwright.config.js`                 |

**Do NOT use Node.js `fetch()` for bypass**: The Fetch spec strips custom headers on
cross-origin redirects. Vercel's Deployment Protection redirects to `vercel.com/sso-api`,
causing the bypass header to be lost. Query params also fail. Use `curl` in the workflow
instead — it preserves headers across redirects.

**Key detail**: Playwright also needs `x-vercel-set-bypass-cookie: samesitenone`
so subsequent navigations (asset loads, client-side routing) inherit the bypass
via cookie — headers alone only work for the initial request.

**Setup checklist**:

- [ ] Enable "Protection Bypass for Automation" on the **client** Vercel project
- [ ] Enable "Protection Bypass for Automation" on the **server** Vercel project
- [ ] Use the **same secret value** for both projects (simplifies GitHub config)
- [ ] Add `VERCEL_AUTOMATION_BYPASS_SECRET` as a GitHub Actions secret
- [ ] Send the header in **every** place that makes HTTP requests to Vercel

---

## 2. Per-Deployment Hash URLs Are Unreliable

**Problem**: Vercel's `repository_dispatch` payload contains a per-deployment
hash URL like `ichnos-protocol-abc123-user-projects.vercel.app`. These URLs
can return `404 DEPLOYMENT_NOT_FOUND` if Vercel cancels/supersedes the build
before the E2E workflow reaches it.

**Root cause**: When you push multiple commits or Vercel rebuilds, older
deployments are cancelled. The `repository_dispatch` event may still fire with
the cancelled deployment's URL.

**Solution**: Use your **stable custom staging domain** (`staging-client.ichnos-protocol.com`)
which always points to the latest successful preview deployment. Store it in a
GitHub Actions secret (`E2E_BASE_URL`) so it's easy to update if the domain changes.

---

## 3. repository_dispatch Fires Multiple Times Per Push

**Problem**: A single `git push` can trigger multiple Vercel deployments
(e.g., one per commit, or redundant builds), each firing its own
`repository_dispatch` event. This causes duplicate E2E runs.

**Solution**: Use a **concurrency group** keyed on something stable:

```yaml
concurrency:
  group: e2e-${{ github.event.client_payload.project.name || github.run_id }}
  cancel-in-progress: true
```

`project.name` is always present in the Vercel payload and is the same across
all deployments for the same project. With `cancel-in-progress: true`, only
the latest dispatch runs.

**What didn't work**: Keying on `deployment.meta.githubCommitRef` or
`deployment.meta.githubCommitSha` — these fields were **empty** in the actual
payload despite being referenced in some documentation.

---

## 4. Always Dump Webhook Payloads First

**Problem**: We assumed the `repository_dispatch` payload contained specific
fields (`deployment.meta.githubCommitSha`, `deployment.meta.githubCommitRef`)
based on documentation. In practice, they were empty.

**Lesson**: Before writing any logic around a webhook payload, add a debug step:

```yaml
- name: Dump payload (debug)
  run: echo '${{ toJSON(github.event.client_payload) }}' | jq '.'
```

Inspect the **actual** data before building logic around it. Documentation
describes the intended schema; the actual payload may differ.

---

## 5. Monorepo = Separate Auth Boundaries

**Problem**: In a monorepo with split Vercel projects (client + server), each
project has its own Deployment Protection. The bypass secret configured on the
client project does not apply to the server project.

**Lesson**: For every HTTP call in the E2E pipeline, ask:
"Which Vercel project does this URL belong to? Does that project have its own
protection?" Then ensure the bypass is configured on every relevant project.

**Inventory of HTTP calls in our pipeline**:

| Call                              | Target project | Needs bypass? |
| --------------------------------- | -------------- | ------------- |
| curl readiness check (client URL) | Client         | Yes           |
| Playwright browser navigation     | Client         | Yes           |
| global-setup health poll (API)    | Server         | Yes           |
| Playwright API calls via app      | Server         | Yes (via app) |

---

## 6. Keep All Vercel Bypass Logic in curl, Not Node.js fetch()

**Problem**: We originally had a `pollHealth` function in Playwright's
`global-setup.js` that used Node.js `fetch()` to poll the API health endpoint.
This failed in three different ways:

1. **Headers approach**: `fetch()` strips custom headers on cross-origin redirects
   (per the Fetch spec). Vercel redirects to `vercel.com/sso-api`, losing the bypass
   header → infinite redirect loop.
2. **Query params approach**: Vercel's server project returned 401 even with bypass
   query parameters — the mechanism is not reliable across all project types.
3. **Both approaches**: Fundamentally incompatible with Vercel's redirect-based
   Deployment Protection flow.

**Solution**: Move **all** readiness polling (including seed status checks) into
the workflow as `curl`-based steps. `curl -L` preserves headers across redirects.
Simplify `global-setup.js` to only validate Firebase credentials.

**Architecture (final)**:

```
Workflow step 1: curl → staging-client URL (HTTP 200 check)
    ↓ passes
Workflow step 2: curl → staging-api /api/health (JSON parsed, seed.seeded === true)
    ↓ passes
Playwright global-setup: Firebase credential validation only
    ↓ passes
Playwright tests run
```

**Lesson**: Never use Node.js `fetch()` to bypass Vercel Deployment Protection.
Use `curl` in the workflow for all server readiness checks.

---

## 7. GitHub Actions Secrets Are Write-Only

**Non-obvious behavior**: After saving a GitHub Actions secret, the value
field appears empty when you revisit the settings page. This is by design —
secrets are write-only for security. The secret is saved if you see it
listed with an "Updated X ago" timestamp.

---

## 8. Use Variables for Non-Sensitive Config, Secrets Only for Credentials

**Problem**: Storing URLs as GitHub Actions secrets makes debugging impossible —
values are masked as `***` in logs. When `E2E_API_BASE_URL` was a secret, the
error `Failed to parse URL from ***/api/health` gave no clue whether the URL
was malformed, missing `https://`, or had a typo. Secrets are also write-only:
you can't view the current value after saving, so you can't verify correctness.

**Solution**: Use **GitHub Actions Variables** (`vars.*`) for non-sensitive
configuration and **Secrets** (`secrets.*`) only for actual credentials.

| Type       | Access in workflow | Visible in UI? | Masked in logs? | Use for                     |
| ---------- | ------------------ | -------------- | --------------- | --------------------------- |
| Variables  | `vars.NAME`        | Yes            | No              | URLs, feature flags, config |
| Secrets    | `secrets.NAME`     | No (write-only)| Yes             | Passwords, API keys, tokens |

**Repository vs. Environment variables**: Use **repository variables** (available
to all workflows, no extra config) unless you have GitHub Environments set up
and need per-environment values. Environment variables require the job to
declare `environment: <name>` to access them.

| Variable           | Purpose                          |
| ------------------ | -------------------------------- |
| `E2E_BASE_URL`     | Stable staging client URL        |
| `E2E_API_BASE_URL` | Stable staging API URL           |

---

## 9. Document All Required Secrets and Variables

**Problem**: Missing secrets/variables cause silent failures — the value is
simply empty, and the workflow fails with a cryptic error (wrong URL, 401,
`Failed to parse URL`, etc.) rather than a clear "not configured" message.

**Solution**: Maintain an explicit list of all required GitHub Actions secrets
and variables in your project documentation (see CLAUDE.md, Section 12). When
adding a new secret or variable dependency, update the docs in the same commit.

---

## 10. GitHub Actions Secrets ≠ Vercel Environment Variables

**Problem**: The server's seed script (`seedE2EOnPreview.js`) runs at cold start
**on the Vercel server**, not in GitHub Actions. Setting `E2E_ADMIN_UID` as a
GitHub Actions secret does nothing for the Vercel runtime — GitHub secrets are
only available to the CI runner process.

**Symptom**: The curl health check returns `200` with a JSON body containing
`seed.error: "Preview environment missing required seed vars: E2E_ADMIN_UID"`.
The secret exists in GitHub but the Vercel server has no access to it.

**Lesson**: There are **three separate environments** that need credentials:

| Environment                  | Where to configure                                    | Who uses it                              |
| ---------------------------- | ----------------------------------------------------- | ---------------------------------------- |
| **GitHub Actions runner**    | GitHub → Settings → Secrets and variables → Actions   | Workflow steps, Playwright test process  |
| **Vercel client project**    | Vercel → Client project → Settings → Env Variables    | Client-side code (`VITE_*` vars)         |
| **Vercel server project**    | Vercel → Server project → Settings → Env Variables    | Server code at runtime (seed script, API)|

For E2E seeding, the server needs these in Vercel (Preview scope only):

| Variable (required)    | Source                                |
| ---------------------- | ------------------------------------- |
| `E2E_ADMIN_EMAIL`      | Same value as GitHub Actions secret   |
| `E2E_ADMIN_UID`        | Firebase Console → Authentication     |

| Variable (optional)         | Source                                |
| --------------------------- | ------------------------------------- |
| `E2E_USER_UID`              | Firebase Console → Authentication     |
| `E2E_USER_EMAIL`            | Same value as GitHub Actions secret   |
| `E2E_SUPER_ADMIN_UID`       | Firebase Console → Authentication     |
| `E2E_SUPER_ADMIN_EMAIL`     | Same value as GitHub Actions secret   |

`DATABASE_URL` and `VERCEL_ENV` are set automatically by Vercel/Neon.

---

## 11. Neon Ephemeral Branches Cause Transient Seed Failures

**Problem**: A single `git push` triggers both client and server Vercel deployments.
Each server deployment gets its own Neon ephemeral database branch. When the second
deployment supersedes the first, Neon tears down the first branch — killing any
active database connections. The seed script on the first deployment fails with
`Connection terminated unexpectedly`.

**Why it matters**: The E2E workflow's health-check step polls `/api/health` and
checks `seed.seeded === true`. If the first deployment's seed fails, the health
endpoint reports the error. If the workflow treats all seed errors as fatal, it
exits immediately — even though the second deployment (which the staging URL now
points to) is still seeding successfully.

**Solution**: Distinguish **permanent** seed errors from **transient** ones:

| Error type  | Example                                    | Action         |
| ----------- | ------------------------------------------ | -------------- |
| Permanent   | `missing required seed vars: E2E_ADMIN_UID`| Fail immediately |
| Transient   | `Connection terminated unexpectedly`       | Keep retrying  |

The workflow retries on transient errors (Neon branch churn, connection resets)
and only fails immediately on permanent config errors (missing env vars).

---

## 12. Pre-Flight Checklist for E2E Pipeline Changes

Before committing any change to the E2E workflow:

1. **curl every URL** the CI will hit, from your local machine, with the same
   headers the CI will use. If you get 401/404 locally, CI will too.
2. **Check all auth boundaries** — list every HTTP request and confirm each
   has the right credentials for the right Vercel project.
3. **Dump raw data first** — for any event-driven trigger, log the full
   payload before writing conditional logic around it.
4. **Use stable URLs** — prefer custom domain aliases over dynamic hash URLs.
5. **Test the bypass secret** against both client and server projects.
6. **Verify secrets are set** — check GitHub Actions settings for each
   required secret before pushing.

---

## Summary of All Required Configurations

### Vercel (per project)

| Setting                        | Client project | Server project |
| ------------------------------ | -------------- | -------------- |
| Repository Dispatch Events     | Enabled        | Disabled       |
| Protection Bypass for Automation | Configured   | Same secret    |

### GitHub Actions Variables (visible, not masked)

| Variable                          | Description                            |
| --------------------------------- | -------------------------------------- |
| `E2E_BASE_URL`                    | Stable staging client URL              |
| `E2E_API_BASE_URL`                | Stable staging API URL                 |

### GitHub Actions Secrets (masked, write-only)

| Secret                            | Description                            |
| --------------------------------- | -------------------------------------- |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Shared bypass secret (both projects)   |
| `E2E_ADMIN_EMAIL`                 | Firebase admin test user email         |
| `E2E_ADMIN_PASSWORD`              | Firebase admin test user password      |
| `E2E_ADMIN_UID`                   | Firebase UID of admin test user        |
| `E2E_USER_EMAIL`                  | Firebase regular test user email       |
| `E2E_USER_PASSWORD`               | Firebase regular test user password    |
| `E2E_SUPER_ADMIN_EMAIL`           | Firebase super admin test user email   |
| `E2E_SUPER_ADMIN_PASSWORD`        | Firebase super admin test user password|
| `FIREBASE_API_KEY`                | Firebase API key for E2E auth flows    |

### Vercel Server Project — Environment Variables (Preview scope)

These must be set in **Vercel → Server project → Settings → Environment Variables**,
scoped to Preview. They are used by the seed script at server cold start.

| Variable (required)        | Description                                 |
| -------------------------- | ------------------------------------------- |
| `E2E_ADMIN_EMAIL`          | Same value as GitHub Actions secret         |
| `E2E_ADMIN_UID`            | Firebase UID (from Firebase Console → Auth) |

| Variable (optional)        | Description                                 |
| -------------------------- | ------------------------------------------- |
| `E2E_USER_UID`             | Firebase UID of regular test user           |
| `E2E_USER_EMAIL`           | Same value as GitHub Actions secret         |
| `E2E_SUPER_ADMIN_UID`      | Firebase UID of super-admin test user       |
| `E2E_SUPER_ADMIN_EMAIL`    | Same value as GitHub Actions secret         |

Note: `DATABASE_URL` and `VERCEL_ENV` are set automatically by Vercel/Neon.
