# Deployment & E2E Testing — Lessons Learned

> A beginner-friendly reference for deploying monorepo web apps with E2E testing.
> Written from real mistakes made on the Ichnos Protocol project (React + Express
> on Vercel, Neon PostgreSQL, Firebase Auth, Playwright, GitHub Actions).
>
> Use this as a **template spec** for future projects. Each section explains
> what went wrong, why, and the simple rule to follow instead.

---

## Table of Contents

1. [How This Document Is Organized](#how-this-document-is-organized)
2. [The Golden Rules](#the-golden-rules)
3. [Part A — Deployment Architecture](#part-a--deployment-architecture)
4. [Part B — E2E Testing Pipeline](#part-b--e2e-testing-pipeline)
5. [Part C — Secrets & Credentials Management](#part-c--secrets--credentials-management)
6. [Part D — Database & Seeding](#part-d--database--seeding)
7. [Part E — Same-Origin API Routing](#part-e--same-origin-api-routing)
8. [Quick Reference Checklists](#quick-reference-checklists)

---

## How This Document Is Organized

Each lesson follows the same format:

- **What went wrong** — the symptom we saw
- **Why it happened** — the root cause (the actual mistake)
- **The simple rule** — what to do instead in future projects
- **Example** — concrete code or config when helpful

Lessons are grouped by topic, not chronologically. If you're setting up a new
project, read the Golden Rules first, then the relevant Part for your task.

---

## The Golden Rules

These five rules would have prevented 80% of the problems we hit. Memorize them.

### Rule 1: Test every HTTP call manually before automating it

Before writing CI/CD workflow code, open a terminal and `curl` every URL your
pipeline will call. Use the exact same headers. If it fails locally, it will
fail in CI — but you'll find out in 5 seconds instead of 20 minutes.

### Rule 2: Log raw data before writing logic around it

Webhook payloads, API responses, environment variables — always dump them first.
Don't assume what fields exist based on documentation. Documentation describes
the *intended* schema; the actual data may differ.

### Rule 3: Use stable URLs, never dynamic deployment hashes

Vercel generates a unique URL for every deployment (`app-abc123.vercel.app`).
These URLs break when Vercel cancels/supersedes a build. Use custom domain
aliases that always point to the latest deployment.

### Rule 4: Know which platform each credential belongs to

There are typically 3+ platforms that need credentials (CI runner, frontend
hosting, backend hosting). A secret set in one platform is invisible to the
others. Map every credential to every platform that needs it.

### Rule 5: Browser API calls should use same-origin routing

Don't make the browser call a different domain for API requests. Use a proxy
(Vite dev proxy for local, platform rewrites for deployed). This eliminates
CORS issues, deployment protection cookie problems, and environment-specific
networking bugs.

---

## Part A — Deployment Architecture

### A1. Monorepo = Separate Deployment Projects = Separate Auth Boundaries

**What went wrong**: We configured Vercel's deployment protection bypass on the
client project but forgot the server project. API calls returned `401` in CI
even though the client was accessible.

**Why it happened**: In a monorepo with two Vercel projects (client + server),
each project has **independent** deployment protection. Configuring one doesn't
affect the other.

**The simple rule**: For every HTTP call in your pipeline, ask: *"Which
deployment project does this URL belong to? Does that project have its own
authentication?"* Make an inventory:

| Call | Target project | Needs auth? |
|------|---------------|-------------|
| curl health check | Server | Yes |
| Browser navigation | Client | Yes |
| API calls from browser | Server | Yes |
| Firebase Auth calls | Firebase (external) | No |

Then configure the bypass/auth on **every** project in the inventory.

### A2. Per-Deployment Hash URLs Are Unreliable

**What went wrong**: The CI pipeline used Vercel's auto-generated hash URLs
(like `app-abc123.vercel.app`) from webhook payloads. These URLs returned
`404 DEPLOYMENT_NOT_FOUND` randomly.

**Why it happened**: When you push multiple commits, Vercel cancels older
builds. The webhook fires with the cancelled build's URL, which no longer
exists by the time CI tries to use it.

**The simple rule**: Set up a **stable custom domain** for your staging
environment (e.g., `staging-client.example.com`). This always points to the
latest successful deployment. Store the URL as a CI variable (not a secret —
see C2), and never parse URLs from webhook payloads.

### A3. Trigger CI on the Slower Deployment

**What went wrong**: E2E tests were triggered by the client deployment (fast).
By the time tests started, the server was still deploying. Tests hit connection
errors and wasted minutes retrying.

**Why it happened**: We triggered on the wrong event. The client deploys in
~30 seconds; the server + database setup takes ~90 seconds.

**The simple rule**: In a monorepo, trigger E2E tests from the **slower**
deployment's webhook. Then poll the faster deployment to confirm it's ready.

```
Push → Client deploys (fast) → Server deploys (slow)
                                       ↓
                             Server webhook fires
                                       ↓
                             CI starts, polls client (usually instant ✓)
                                       ↓
                             Run tests
```

**Example** (GitHub Actions):
```yaml
on:
  repository_dispatch:
    types: [vercel.deployment.success]  # Fired by server project
```

### A4. Deduplicate CI Runs with Concurrency Groups

**What went wrong**: A single `git push` triggered multiple Vercel deployments,
each firing a webhook, each starting an E2E run. We had 3-4 identical CI runs
competing.

**Why it happened**: Vercel fires one webhook per deployment, and pushes with
multiple commits can trigger multiple deployments.

**The simple rule**: Use a concurrency group with `cancel-in-progress: true`:

```yaml
concurrency:
  group: e2e-${{ github.event.client_payload.project.name || github.run_id }}
  cancel-in-progress: true
```

Only the latest run survives. Older runs are automatically cancelled.

### A5. Protect Against Accidentally Targeting Production

**What went wrong**: E2E tests write data (seed records, form submissions). If
the test URL variable accidentally points to production, live data gets
corrupted.

**The simple rule**: Add a **production hostname denylist** at the start of your
CI workflow. Hard-fail if the test URL matches any production domain.

```yaml
env:
  PRODUCTION_HOSTS: "myapp.com www.myapp.com api.myapp.com"
```

Key details:
- Use **exact hostname match** (not substring or regex)
- **Fail-closed**: if the denylist is missing or empty, abort — don't proceed
- The denylist in the workflow file is the source of truth

---

## Part B — E2E Testing Pipeline

### B1. Never Use Node.js `fetch()` to Bypass Deployment Protection

**What went wrong**: We used `fetch()` in Playwright's `global-setup.js` to
poll the server's health endpoint. It failed silently — the server returned
Vercel's HTML auth page instead of JSON.

**Why it happened**: The Fetch API spec **strips custom headers on cross-origin
redirects**. Vercel's deployment protection redirects to `vercel.com/sso-api`,
causing the bypass header to be lost. This is a browser/Node.js spec behavior,
not a Vercel bug.

**The simple rule**: Use `curl` in the CI workflow for all deployment readiness
checks. `curl -L` preserves headers across redirects. Keep `global-setup.js`
minimal — only validate credentials that Playwright needs (e.g., Firebase
tokens), not server availability.

**Architecture**:
```
Workflow:   curl → client URL (HTTP 200?)
Workflow:   curl → /api/health (JSON? seed ready?)
global-setup.js:  Firebase credential validation only
Playwright: tests run
```

### B2. Playwright Needs Both Bypass Header and Cookie

**What went wrong**: Playwright's first page navigation worked, but subsequent
navigations (asset loads, client-side routing) returned `401`.

**Why it happened**: The bypass header only works for explicit HTTP requests.
Browser-initiated requests (images, scripts, navigation) can't carry custom
headers. You need Vercel to set a **bypass cookie** so subsequent requests
inherit the authentication.

**The simple rule**: Send both headers in Playwright config:

```js
extraHTTPHeaders: {
  'x-vercel-protection-bypass': process.env.BYPASS_SECRET,
  'x-vercel-set-bypass-cookie': 'samesitenone',
}
```

The first header authenticates. The second tells Vercel to set a cookie for
all future requests from that browser session.

### B3. Always Dump Webhook Payloads Before Building Logic

**What went wrong**: We wrote conditional logic assuming the webhook payload
contained `deployment.meta.githubCommitSha`. The field was empty in practice.

**Why it happened**: We trusted the documentation without verifying. The actual
payload didn't match the documented schema.

**The simple rule**: Add a debug step as your **first** action in any
event-driven workflow:

```yaml
- name: Dump payload
  run: echo '${{ toJSON(github.event.client_payload) }}' | jq '.'
```

Read the actual data. Then write logic.

### B4. Separate E2E Targets from Manual QA Targets

**What went wrong**: E2E tests and manual QA both targeted the same staging
URL. E2E seed data polluted manual QA sessions. Manual QA ran against
ephemeral databases that expired mid-test.

**Why it happened**: Two different use cases (automated testing vs. human
testing) were overloaded onto a single URL.

**The simple rule**: Use separate branches with different database backends:

| Purpose | Branch | Database | Seed? |
|---------|--------|----------|-------|
| E2E (automated) | `main` previews | Ephemeral (Neon branch) | Yes |
| Manual QA | `staging` | Production | No (`SKIP_E2E_SEED=true`) |

Auto-sync staging from main after each deployment so it always has the latest
code but uses production data for realistic manual testing.

### B5. Pre-Flight Checklist Before Any Pipeline Change

Before committing CI/E2E workflow changes:

1. `curl` every URL with the same headers CI will use
2. List every HTTP request and confirm credentials for each
3. Dump raw webhook/API data before writing conditionals
4. Use stable URLs, not hash URLs
5. Test the bypass secret against **both** Vercel projects
6. Verify all secrets/variables are set in GitHub before pushing

---

## Part C — Secrets & Credentials Management

### C1. Three Platforms Need Credentials — Don't Confuse Them

**What went wrong**: We set `E2E_ADMIN_UID` as a GitHub Actions secret. The
server's seed script (running on Vercel) couldn't find it and failed with
"missing required seed vars."

**Why it happened**: GitHub Actions secrets are only available to the CI runner
process. The Vercel server runtime is a completely separate environment.

**The simple rule**: Map every credential to every platform that needs it:

| Platform | Where to configure | Who uses it |
|----------|-------------------|-------------|
| CI runner (GitHub Actions) | GitHub → Settings → Secrets | Workflow steps, Playwright |
| Frontend hosting (Vercel client) | Vercel → Client → Env Variables | Client code (`VITE_*`) |
| Backend hosting (Vercel server) | Vercel → Server → Env Variables | Server runtime (seed, API) |

A credential set in one platform is **invisible** to the others.

### C2. Use Variables for URLs, Secrets Only for Passwords

**What went wrong**: We stored staging URLs as GitHub Actions secrets. Logs
showed `Failed to parse URL from ***/api/health` — the URL was masked as `***`,
making debugging impossible.

**Why it happened**: Secrets are masked in logs (by design). URLs aren't
sensitive — they should be visible for debugging.

**The simple rule**:

| Type | Visible in logs? | Visible in UI? | Use for |
|------|-----------------|----------------|---------|
| Variables (`vars.*`) | Yes | Yes | URLs, config, feature flags |
| Secrets (`secrets.*`) | No (masked) | No (write-only) | Passwords, API keys, tokens |

### C3. Secrets Are Write-Only — You Can't Verify Them

**What went wrong**: After setting a GitHub Actions secret, we went back to
verify the value — the field was blank. We thought it wasn't saved and re-set
it (introducing a typo).

**Why it happened**: GitHub Actions secrets are write-only by design. You can
see *that* a secret exists and *when* it was last updated, but never its value.

**The simple rule**: Accept that secrets are write-only. If something isn't
working, re-set the secret from your canonical source file (see C4) rather
than trying to debug the stored value.

### C4. One Canonical File for All Credentials

**What went wrong**: E2E credentials (3 roles × 3 fields × 3 platforms ≈ 27
entries) were manually maintained across GitHub, Vercel, and local `.env` files.
Mismatches silently broke the pipeline.

**Why it happened**: No single file owned the values. Each platform was
configured independently.

**The simple rule**: Create a **single canonical file** (e.g., `.env.e2e` at
repo root, gitignored). Write a provisioning script that reads this file and
syncs the correct subset to each platform:

| Platform | What gets synced |
|----------|------------------|
| GitHub Actions | Emails + passwords (secrets) |
| Vercel Server (Preview) | Emails + UIDs (env vars) |
| Local | Everything (canonical source) |

Run the script once during setup and whenever credentials change.

### C5. Pass Secrets via stdin, Not Command-Line Arguments

**What went wrong**: Provisioning script passed passwords as CLI arguments.
Passwords with `$`, `!`, or backticks broke due to shell interpolation.

**Why it happened**: Shell argument parsing interprets special characters.
Different shells (bash, zsh, PowerShell) handle quoting differently.

**The simple rule**: Use stdin piping. Both `gh secret set` and `vercel env
add/update` accept values from stdin:

```js
execSync(`gh secret set ${name}`, {
  input: value,
  stdio: ['pipe', 'pipe', 'pipe']
});
```

The value never touches the shell's argument parser.

### C6. Vercel Env Upsert: Update-Then-Add

**What went wrong**: `vercel env add` failed because the variable already
existed. `vercel env update` failed because it didn't exist yet. There's no
upsert command.

**The simple rule**: Try update first; if it fails, fall back to add:

```js
try {
  execSync(`vercel env update ${name} preview`, { input: value });
} catch {
  execSync(`vercel env add ${name} preview`, { input: value });
}
```

Never use remove-then-add — it's non-atomic and loses the variable if the
process crashes between the two calls.

### C7. Resolve File Paths from `import.meta.url`, Not `process.cwd()`

**What went wrong**: A script that loaded `.env` files broke when run from a
different directory.

**Why it happened**: `process.cwd()` depends on where you run the command, not
where the script lives. In a monorepo with wrapper scripts, the working
directory is unpredictable.

**The simple rule**:

```js
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env.e2e');
```

---

## Part D — Database & Seeding

### D1. Serverless Cold Starts Can Kill Database Connections

**What went wrong**: The E2E seed script failed with "Connection terminated
unexpectedly" and "Authentication timed out" on first deployment.

**Why it happened**: Neon's serverless PostgreSQL starts suspended
(scale-to-zero). The first connection on cold start can take 5-10 seconds.
The default connection timeout was too short.

**The simple rule**: Add retry logic with exponential backoff for database
connections in seed scripts. Detect transient errors and retry; fail fast on
permanent errors:

| Error type | Examples | Action |
|-----------|---------|--------|
| Transient | "timed out", "Connection terminated", "ECONNRESET" | Retry (up to 5 times, 5s delay) |
| Permanent | "missing required seed vars", "permission denied" | Fail immediately |

### D2. Fire-and-Forget Async Work Dies on Serverless

**What went wrong**: The seed script ran at server startup as a fire-and-forget
`Promise`. It was interrupted before completing.

**Why it happened**: Vercel serverless functions are killed after sending the
HTTP response. Any async work not `await`ed within a request handler is lost.

**The simple rule**: If work must complete on serverless, run it **inside** a
request handler and `await` it. We moved seeding into the `/api/health`
handler:

```js
app.get('/api/health', async (req, res) => {
  await ensureSeeded();  // Keeps function alive until done
  res.json({ status: 'ok', seed: seedStatus });
});
```

### D3. Ephemeral Database Branches Cause Connection Churn

**What went wrong**: Multiple deployments from a single push each got their own
Neon database branch. When the second deployment superseded the first, Neon
tore down the first branch — killing active connections.

**Why it happened**: Neon creates ephemeral branches per Vercel preview
deployment. Rapid successive deployments cause branch churn.

**The simple rule**: Distinguish transient seed failures (connection reset)
from permanent ones (missing config). Retry transient failures because they
resolve when the new deployment's database branch stabilizes. Report permanent
failures immediately.

---

## Part E — Same-Origin API Routing

### E1. Cross-Domain API Calls Break with Deployment Protection

**What went wrong**: The staging client could load in the browser, but all API
calls failed with "An unexpected error occurred."

**Why it happened**: The client was on `staging-client.example.com` and called
the API on `staging-api.example.com`. The browser had a Vercel auth cookie for
the client domain, but cookies aren't sent cross-domain. The API server saw an
unauthenticated request and returned an HTML auth page instead of JSON.

**The simple rule**: Never make the browser call a different domain for APIs.
Use same-origin routing:

| Environment | How `/api/*` is proxied |
|-------------|------------------------|
| Local dev | Vite's `server.proxy` → `http://localhost:3000` |
| Staging/Prod | Vercel `rewrites` in `vercel.json` → server URL |

```js
// vite.config.js
server: {
  proxy: {
    '/api': { target: 'http://localhost:3000', changeOrigin: true }
  }
}
```

```json
// client/vercel.json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://staging-api.example.com/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Set `VITE_API_BASE_URL=` (empty) so the client always calls `/api/*` on its own
origin.

### E2. Don't Expose Bypass Secrets in Browser Code

**What went wrong** (almost): We considered adding the Vercel bypass secret as
an environment variable in the client bundle so API calls could include the
bypass header.

**Why we didn't**: `VITE_*` environment variables are embedded in the JavaScript
bundle at build time. Anyone can view the page source and extract the secret.
The bypass secret grants full access to protected deployments.

**The simple rule**: Never put deployment bypass secrets in client-side code.
Same-origin routing eliminates the need — the proxy handles authentication at
the edge, server-to-server.

### E3. Add a Startup Health Check

**The simple rule**: On app initialization, fetch `/api/health` and verify the
response is JSON. If it returns HTML (Vercel auth page) or fails, show a clear
error: "API is not reachable — check your configuration." This catches
routing/proxy misconfiguration immediately instead of surfacing as cryptic auth
errors later.

### E4. Preview Deployment Parity Is a Separate Problem

**What we deferred**: PR preview deployments get dynamic URLs. The
`client/vercel.json` rewrite has a hardcoded server destination, so previews
can't use same-origin routing without extra work (dynamic rewrites, edge
middleware, or build-time URL injection).

**The simple rule**: Get same-origin working for local + staging + production
first. Preview parity is a hardening task — document it, defer it. Previews
can temporarily use direct API calls with bypass headers (like E2E tests
already do). Don't block shipping on preview parity.

---

## Quick Reference Checklists

### New Project Setup

- [ ] Set up stable custom domains for staging (client + server)
- [ ] Configure deployment protection bypass on **both** projects (same secret)
- [ ] Store bypass secret as GitHub Actions secret
- [ ] Store staging URLs as GitHub Actions **variables** (not secrets)
- [ ] Create `.env.e2e` as canonical credential source
- [ ] Write provisioning script to sync credentials across platforms
- [ ] Set up Vite dev proxy for local `/api/*` routing
- [ ] Add Vercel rewrites for deployed `/api/*` routing
- [ ] Add production hostname denylist to E2E workflow
- [ ] Trigger E2E from the slower deployment's webhook
- [ ] Add concurrency group with `cancel-in-progress: true`

### Before Every CI/CD Change

- [ ] `curl` every URL with the exact headers CI will use
- [ ] List every HTTP call and confirm which project/credentials it needs
- [ ] Dump raw webhook/API data before writing conditional logic
- [ ] Verify all required secrets and variables are set in GitHub
- [ ] Test bypass secret against both Vercel projects

### When E2E Fails in CI

1. Check the **workflow logs** — look for `401`, `404`, HTML responses
2. Check if the staging URL is reachable: `curl -I https://staging-client.example.com`
3. Check if the API is reachable: `curl https://staging-api.example.com/api/health`
4. Check seed status: look for `seed.mode` in the health response
5. If `seed.mode: "failed"` — check Vercel server env vars (C1)
6. If `seed.mode: "in_progress"` — it's a transient Neon issue, retry
7. If HTML response — deployment protection bypass isn't working (A1, B1)
8. If `DEPLOYMENT_NOT_FOUND` — hash URL expired, switch to stable URL (A2)
