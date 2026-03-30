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
which always points to the latest successful preview deployment. Store it as a
**GitHub Actions Variable** (`vars.E2E_BASE_URL`) — not a secret — so the value is
visible in logs and easy to verify. See §8 for the variables-vs-secrets distinction.

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

## 12. Trigger E2E on the Slower Deployment (Pattern B: Filter + Poll)

**Problem**: A single `git push` triggers both client and server Vercel deployments.
If E2E is triggered by the **client** (which deploys faster), the server and its Neon
ephemeral DB are still deploying. The workflow hits transient errors like
"Authentication timed out" or "Connection terminated unexpectedly" and wastes minutes
retrying. Debounce (sleep + timestamp check) is a workaround but adds idle time and
complexity.

**Root cause**: E2E was triggered by the wrong event. The client fires dispatch first,
but tests need both client AND server to be ready.

**Solution — Pattern B (Filter + Poll)**:
Trigger E2E on the **server's** `repository_dispatch` event (the slower deployment),
then poll the client's stable staging URL to verify it's also ready.

```
Push → Client deploys (fast) → Server deploys + seeds DB (slow)
                                        ↓
                              repository_dispatch fires
                                        ↓
                              E2E workflow starts
                                        ↓
                              Poll client URL (usually instant ✓)
                                        ↓
                              Verify API health + seed (should pass ✓)
                                        ↓
                              Run Playwright tests
```

**Why this works**: By waiting for the slower deployment, the faster one is almost
always ready when we check. No debounce, no sleep, no wasted CI time.

**Vercel project configuration**:
- **Server project**: Enable "Repository Dispatch Events" in Git settings.
- **Client project**: Disable "Repository Dispatch Events" (no longer needed).

**Edge case — push that only changes `client/` files**: The server doesn't redeploy,
so no dispatch fires and no E2E run starts. This is acceptable: the server didn't
change, so existing E2E results still apply. Use `workflow_dispatch` for manual
validation if needed.

**This replaced the earlier debounce approach** (sleep 90s + GitHub API check for
newer runs), which was complex and still wasted runner time.

---

## 13. Pre-Flight Checklist for E2E Pipeline Changes

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
| Repository Dispatch Events     | Disabled       | Enabled        |
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
| `E2E_USER_EMAIL`                  | Firebase regular test user email       |
| `E2E_USER_PASSWORD`               | Firebase regular test user password    |
| `E2E_SUPER_ADMIN_EMAIL`           | Firebase super admin test user email   |
| `E2E_SUPER_ADMIN_PASSWORD`        | Firebase super admin test user password|
| `FIREBASE_API_KEY`                | Firebase API key for E2E auth flows    |

> **Note:** Firebase UIDs (`E2E_*_UID`) are no longer GitHub Actions secrets. UIDs are only consumed by the Vercel server seed script and belong in Vercel Preview env vars. Use the provisioning script (`node scripts/provision-e2e-firebase-users.js`) to manage all E2E credentials from a single `.env.e2e` file.

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

---

## 14. Single Source of Truth for Cross-Platform Credentials

**Problem**: E2E test credentials (emails, passwords, Firebase UIDs) were manually
maintained across three platforms: GitHub Actions secrets, Vercel Server Preview env
vars, and local `.env` files. With 3 roles x 3 credentials x 3 platforms = ~27 manual
entries, any mismatch silently broke the E2E pipeline. GitHub secrets are write-only,
making it impossible to verify what value is currently stored.

**Root cause**: No single canonical file owned the credential values. Each platform
was configured independently, with no automated way to detect or prevent drift.

**Solution**: Introduce a `.env.e2e` file at the repo root as the single source of
truth. A provisioning script reads this file, provisions Firebase users, writes UIDs
back, and syncs the correct subset to each platform:

| Platform            | What gets synced           |
| ------------------- | -------------------------- |
| GitHub Actions      | Emails + passwords         |
| Vercel Server (Preview) | Emails + UIDs          |
| Local `.env.e2e`    | Everything (canonical)     |

**Lesson**: When the same credentials must exist on multiple platforms, pick one
canonical file and automate the fan-out. Manual copy-paste across write-only stores
guarantees eventual drift.

---

## 15. Explicit `import.meta.url` Path Resolution for Env Files

**Problem**: The provisioning script loads both the repo-root `.env.e2e` and
`server/.env`. Using `process.cwd()`-relative paths broke when the script was
invoked from different directories (e.g., the root CJS wrapper executes from the
repo root, but the ESM orchestrator lives in `server/scripts/`).

**Root cause**: `process.cwd()` depends on where the user runs the command, not
where the script file lives. In a monorepo with a CJS wrapper delegating to an ESM
module, the working directory is unpredictable.

**Solution**: Resolve all file paths from `import.meta.url` using `fileURLToPath`
and `path.resolve`. This anchors paths to the script's location in the source tree,
not the shell's working directory.

```js
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../..', '.env.e2e');
```

**Lesson**: In ESM scripts that may be invoked indirectly (via wrappers, `execSync`,
or npm scripts), always resolve paths from `import.meta.url`. Never assume `cwd`.

---

## 16. Shell-Safe CLI Secret Syncing via stdin

**Problem**: Passing secret values as command-line arguments (e.g.,
`gh secret set NAME --body "$VALUE"`) breaks when the value contains shell-special
characters (`$`, `!`, `` ` ``, quotes, backslashes). Passwords frequently contain
these characters.

**Root cause**: Shell interpolation. Even with proper quoting, edge cases exist
across shells (bash, zsh, PowerShell). Escaping is fragile and platform-dependent.

**Solution**: Use `child_process.execSync` (or `spawn`) with stdin piping. Both
`gh secret set` and `vercel env add/update` accept values from stdin:

```js
execSync(`gh secret set ${name}`, { input: value, stdio: ['pipe', 'pipe', 'pipe'] });
```

The value never touches the shell's argument parser — it goes directly from the
Node.js process to the CLI tool's stdin stream.

**Lesson**: When syncing secrets via CLI tools, always use stdin input instead of
shell arguments. This eliminates an entire class of quoting/escaping bugs.

---

## 17. Vercel Env Update-Then-Add Pattern

**Problem**: The Vercel CLI has separate commands for creating (`vercel env add`)
and updating (`vercel env update`) environment variables. `env add` fails if the
variable already exists; `env update` fails if it doesn't. There is no upsert
command. Running `env rm` + `env add` works but is destructive and non-atomic.

**Solution**: Attempt `vercel env update` first. If it fails (variable doesn't
exist), fall back to `vercel env add`. Both commands accept the value via stdin
for shell safety.

```js
try {
  execSync(`vercel env update ${name} preview`, { input: value, cwd: serverDir });
} catch {
  execSync(`vercel env add ${name} preview`, { input: value, cwd: serverDir });
}
```

**Why not remove-then-add?** The remove+add pattern is non-atomic: if the process
crashes between remove and add, the variable is lost. The update-then-add pattern
is safe to retry at any point — the worst case is a redundant update.

**Lesson**: When the target API lacks an upsert, prefer update-then-add over
remove-then-add. It's idempotent and safe to interrupt.

---

## 18. The Provisioning Script Is a Local/Manual Tool — Not a CI Step

**Problem**: The provisioning script (`node scripts/provision-e2e-firebase-users.js`)
calls `gh secret set` and `vercel env update/add` using locally authenticated CLIs.
It also depends on `server/.vercel/project.json` linkage and local `.env.e2e`/`server/.env`
files. These are local environment prerequisites that are not available (and not needed)
on a CI runner.

**Key distinction**: CI workflows (`ci.yml`) and the E2E workflow (`e2e.yml`) do **not**
execute the provisioning script. They consume the GitHub Actions secrets and Vercel
Preview env vars that the script has already synced. The script is a one-time (or
as-needed) local admin setup step.

**Environment differences can change behavior**: The script's outcome depends on local
CLI installation and PATH, `gh` and `vercel` auth state, the linked Vercel project in
`server/.vercel/project.json`, local env files, and the shell/terminal session. One
terminal or machine may succeed while another fails against the same repo contents. This
is expected, not a bug.

**Troubleshooting checklist for terminal-related failures**:

1. Confirm you are running from the repo root
2. `gh auth status`
3. `vercel whoami`
4. `cd server && vercel link` (must link to `ichnos-protocolserver`)

**Lesson**: Treat the provisioning script as a local admin setup tool, not part of the
CI/CD pipeline. Treat terminal-related errors as local environment/setup issues first.
