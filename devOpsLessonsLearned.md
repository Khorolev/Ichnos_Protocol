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

| Caller                  | How to send                                                  |
| ----------------------- | ------------------------------------------------------------ |
| curl (readiness check)  | `-H "x-vercel-protection-bypass: $SECRET"`                   |
| Playwright (browser)    | `extraHTTPHeaders` in `playwright.config.js`                 |
| global-setup (fetch)    | `headers` option in `fetch()` call                           |

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

## 6. global-setup vs. Workflow Readiness Checks

**Problem**: We had a `curl` readiness check in the workflow AND a `pollHealth`
in Playwright's `global-setup.js`. Both needed the bypass header, but they
check different services (client vs. API server).

**Architecture**:

```
Workflow step: curl → staging-client URL (client Vercel project)
    ↓ passes
Playwright global-setup: fetch → staging-api URL (server Vercel project)
    ↓ passes
Playwright tests run
```

**Lesson**: When you have multiple readiness checks, document which service
each one targets and ensure each has the correct credentials.

---

## 7. GitHub Actions Secrets Are Write-Only

**Non-obvious behavior**: After saving a GitHub Actions secret, the value
field appears empty when you revisit the settings page. This is by design —
secrets are write-only for security. The secret is saved if you see it
listed with an "Updated X ago" timestamp.

---

## 8. Store URLs in Secrets, Not in Code

**Problem**: Hardcoding staging URLs in workflow files makes them hard to
find and update when domains change.

**Solution**: Store deployment URLs as GitHub Actions secrets:

| Secret             | Purpose                          |
| ------------------ | -------------------------------- |
| `E2E_BASE_URL`     | Stable staging client URL        |
| `E2E_API_BASE_URL` | Stable staging API URL           |

This also keeps the URLs out of the git history, which is useful if staging
domains are considered semi-private.

---

## 9. Document All Required Secrets

**Problem**: Missing secrets cause silent failures — the variable is simply
empty, and the workflow fails with a cryptic error (wrong URL, 401, etc.)
rather than a clear "secret not configured" message.

**Solution**: Maintain an explicit list of all required GitHub Actions secrets
in your project documentation (see CLAUDE.md, Section 12). When adding a new
secret dependency, update the docs in the same commit.

---

## 10. Pre-Flight Checklist for E2E Pipeline Changes

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

### GitHub Actions Secrets

| Secret                            | Description                            |
| --------------------------------- | -------------------------------------- |
| `E2E_BASE_URL`                    | Stable staging client URL              |
| `E2E_API_BASE_URL`                | Stable staging API URL                 |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Shared bypass secret (both projects)   |
| `E2E_ADMIN_EMAIL`                 | Firebase admin test user email         |
| `E2E_ADMIN_PASSWORD`              | Firebase admin test user password      |
| `E2E_USER_EMAIL`                  | Firebase regular test user email       |
| `E2E_USER_PASSWORD`               | Firebase regular test user password    |
| `E2E_SUPER_ADMIN_EMAIL`           | Firebase super admin test user email   |
| `E2E_SUPER_ADMIN_PASSWORD`        | Firebase super admin test user password|
| `FIREBASE_API_KEY`                | Firebase API key for E2E auth flows    |
