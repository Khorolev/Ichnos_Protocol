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
8. [Part F — E2E Test Infrastructure & Browser Auth](#part-f--e2e-test-infrastructure--browser-auth)
9. [Part G — E2E Selector Pitfalls & CI Cascade Prevention](#part-g--e2e-selector-pitfalls--ci-cascade-prevention)
10. [Quick Reference Checklists](#quick-reference-checklists)

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

Set `VITE_API_HOST` to the server hostname (e.g., `e2e-api.ichnos-protocol.com` for E2E,
`staging-api.ichnos-protocol.com` for staging). This is used by `client/vercel.json`
to rewrite `/api/*` requests. The client then calls `/api/*` on its own
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

## Part F — E2E Test Infrastructure & Browser Auth

### F1. Post-Navigation Auth Race Condition

**What went wrong**: Authenticated user tests (contact form, chatbot) failed
with "modal intercepts pointer events." A Bootstrap modal overlay blocked all
interactions after the user navigated from the login page to the contact page.

**Why it happened**: `loginAsUser(page)` authenticates at `/`. Then
`page.goto('/contact')` does a **full page reload**. The React app starts fresh,
and `useAuthInit` fires asynchronously to restore auth from IndexedDB. During
this restoration window (typically 1-3s, up to 10s in CI), `isAuthenticated`
is `false`. The ContactForm's `useEffect` checks `isOpen && !isAuthenticated`
and opens an auth modal — which overlays everything.

**The simple rule**: After `loginAsUser(page)` + `page.goto('/path')`, always
wait for the auth state to be fully restored before interacting with the page.
Check for a reliable auth indicator (e.g., user menu toggle):

```js
export async function waitForAuthedAppReady(page, path = '/') {
  await waitForAppReady(page, path);
  await expect(
    page.getByTestId('user-menu-toggle').first(),
  ).toBeVisible({ timeout: TIMEOUTS.authVerify });
}
```

Use this helper instead of `waitForAppReady` whenever the test requires an
authenticated user.

### F2. Playwright `addLocatorHandler` for Persistent Modals

**What went wrong**: After login, the "Complete Your Profile" modal appeared on
every page navigation. The one-shot dismiss in `loginAs()` only handled it
once; subsequent `goto()` calls re-triggered it.

**Why it happened**: Each `goto()` reloads the React app. `onAuthStateChanged`
fires, `getMe` returns `isProfileComplete: false`, and the unclosable modal
re-appears.

**The simple rule**: Use Playwright's `page.addLocatorHandler()` to register a
persistent handler that auto-dismisses the modal whenever it blocks any action.
Register it ONCE per page; it survives navigations:

```js
await page.addLocatorHandler(
  modal.getByText('Complete Your Profile'),
  async () => {
    await page.locator('#completion-name').fill('E2E');
    await page.locator('#completion-surname').fill('TestUser');
    await modal.getByRole('button', { name: 'Continue' }).click();
  },
);
```

### F3. Worker-Scoped Contexts Need Auth Restoration Awareness

**What went wrong**: Admin E2E tests used worker-scoped browser contexts. The
login happened on a `loginPage` (then closed). New `adminPage` instances from
the same context navigated to `/admin`, but the admin dashboard never rendered.

**Why it happened**: When a new page opens in the same context, Firebase auth
is restored from IndexedDB (shared across pages in a context). But the
restoration is async. If the `AdminRoute` guard checks auth before restoration
completes, it sees `isAdmin: false` and may redirect.

**The simple rule**: When admin tests fail at dashboard loading, add diagnostic
logging to capture:
- Current URL (did it redirect to `/`?)
- Page body text (is it showing the landing page? Vercel protection page?)
- API responses during page load (did `getMe` fire? What did it return?)

This pinpoints whether the issue is auth restoration, route guarding, or
deployment protection.

### F4. Strict Mode Selector Violations After UI Changes

**What went wrong**: `page.getByRole('button', { name: 'Login' })` found 2
elements after logout — one in the navbar, one in a CTA section.

**Why it happened**: When a component's DOM changes (e.g., user logs out and
new elements appear), generic selectors can match multiple elements.

**The simple rule**: Always scope selectors to the nearest stable container:

```js
// Bad: ambiguous
page.getByRole('button', { name: 'Login' });

// Good: scoped to navbar
page.getByTestId('navbar').getByRole('button', { name: 'Login' });
```

### F5. `force: true` on Checkbox Clicks Doesn't Toggle React State

**What went wrong**: A test used `checkbox.click({ force: true })` on a
Bootstrap custom checkbox. The checkbox appeared checked visually but the React
component's `onChange` handler never fired, leaving the form in an invalid state.

**Why it happened**: Bootstrap renders the `<input type="checkbox">` as hidden,
with a visible `<label>` overlay. `force: true` bypasses actionability checks
and clicks the hidden input directly, but the event dispatch path differs from
a user clicking the visible label.

**The simple rule**: Never use `force: true` on form controls in React apps.
Instead, use the POM method that clicks the element as a user would:

```js
// Bad
await modal.getByRole('checkbox').click({ force: true });

// Good — uses the POM method which clicks naturally
await contact.checkPrivacy();
```

### F6. Warm Vercel Instances Don't Re-Run Seed Scripts

**What went wrong**: After adding new env vars (`E2E_USER_UID`) to Vercel and
redeploying, the seed script still skipped the user — the DB had no user
profile row.

**Why it happened**: The seed script uses a module-level `seedPromise` singleton
that runs once per function instance. Warm (reused) instances from previous
deployments retain the old singleton result and never re-run the seed.

**The simple rule**: After changing Vercel env vars that affect seeding:
1. Redeploy the server project (creates new code bundle)
2. Verify via `/api/health` that `seed.mode: "seeded"` AND uptime is low
   (high uptime = warm instance from old deployment)
3. If the warm instance persists, manually seed via SQL or wait for cold start

### F7. Null Column Constraints vs. Partial Profile Sync

**What went wrong**: `sync-profile` crashed with 500: "null value in column
'name' of relation 'user_profiles' violates not-null constraint."

**Why it happened**: The login flow sends only `{ firebaseUid, email }` to
`sync-profile`. The server's merge logic fetches the existing profile to
preserve fields. But if no profile row exists yet, the merge has nothing to
merge with — the `name` field is null, hitting the NOT NULL constraint.

**The simple rule (app bug to fix)**: The `syncProfile` service should handle
the case where the user has no existing profile row. Either:
- Make `name`/`surname` nullable in the DB (with a separate completion check)
- Default to placeholder values when creating a new profile
- Skip the upsert if the incoming data lacks required fields

For E2E: ensure the seed script always creates complete profile rows for test
users.

### F8. CORS for Firebase Auth in CI (Playwright Proxy)

**What went wrong**: Firebase `signInWithEmailAndPassword` failed with network
errors in GitHub Actions.

**Why it happened**: GitHub Actions runners sometimes block or strip CORS
headers from requests to `identitytoolkit.googleapis.com` and
`securetoken.googleapis.com`.

**The simple rule**: Register a Playwright context-level route handler that
intercepts Firebase API requests and proxies them through Node.js `fetch()`
(which has no CORS restrictions). The browser receives the response as if CORS
was allowed:

```js
await context.route('**/identitytoolkit.googleapis.com/**', async (route) => {
  const response = await fetch(route.request().url(), { /* ... */ });
  await route.fulfill({ status: response.status, body: await response.text() });
});
```

Register this on the browser context (not page) so it applies to all pages.

---

## Part G — E2E Selector Pitfalls & CI Cascade Prevention

### G1. Bootstrap Nav.Link Role Depends on Context

**What went wrong**: `getByRole('link', { name: 'Chat-only Leads' })` timed out
after 15s — the element existed on the page but didn't match the role.

**Why it happened**: Bootstrap's `Nav.Link` renders different ARIA roles
depending on its parent context:
- Inside `<Tabs>` → renders with `role="tab"`
- Standalone `<Nav>` → renders as a plain `<a>` or `<button>` with no explicit
  ARIA role (no `role="tab"`, no `role="link"`)

The admin dashboard uses a standalone `<Nav variant="pills">` for sub-tabs
(Inquiries / Chat-only Leads) inside the Requests tab panel. Since it's not
wrapped in Bootstrap's `<Tabs>`, the rendered `<a>` has no semantic role.

**The simple rule**: When targeting Bootstrap Nav elements in E2E tests:
1. First try `getByRole('tab')` if the Nav is inside `<Tabs>`
2. For standalone `<Nav>`, use CSS class selectors:
   ```js
   page.locator('.nav-link', { hasText: 'Chat-only Leads' })
   ```
3. Never assume `getByRole('link')` — Bootstrap Nav.Link rarely renders as a
   true link element.

### G2. Case-Sensitive Text Matching in Playwright

**What went wrong**: `getByText('new')` and `getByText('contacted')` didn't
match column headers rendering `New` and `Contacted`.

**Why it happened**: Playwright's `getByText()` is **case-sensitive** by
default. The test used lowercase but the app renders Title Case.

**The simple rule**: Always match the exact case as rendered in the UI. Use
`{ exact: true }` for short words to avoid substring matching across unrelated
elements:
```js
// Bad — case-sensitive mismatch
adminPage.getByText('new');

// Good — matches exactly
adminPage.getByText('New', { exact: true });
```

### G3. Bootstrap ListGroup.Item Renders as `<div>`, Not `<li>`

**What went wrong**: `getByRole('listitem')` returned no matches when targeting
Bootstrap `<ListGroup.Item>` elements.

**Why it happened**: `ListGroup.Item` renders as `<div class="list-group-item">`
by default, not as `<li>`. The `listitem` ARIA role requires an actual `<li>`
element or explicit `role="listitem"`.

**The simple rule**: Use CSS class selectors for Bootstrap list components:
```js
// Bad — Bootstrap doesn't render <li>
page.getByRole('listitem').filter({ hasText: 'text' });

// Good — matches the actual DOM
page.locator('.list-group-item').filter({ hasText: 'text' });
```

### G4. RTK Query Timing After Auth Restoration

**What went wrong**: `waitForAuthedAppReady` returned (user-menu visible), but
`useGetMyRequestsQuery` hadn't fired yet, so `MyInquiriesList` wasn't rendered
when the test immediately checked for it.

**Why it happened**: RTK Query hooks with `skip: !isAuthenticated` only fire
AFTER the Redux state updates. The auth restoration flow is:
1. `onAuthStateChanged` fires → `setUser`, `setLoading(false)`
2. React re-renders → user-menu-toggle appears (waitForAuthedAppReady returns)
3. `isAuthenticated` flips to `true` → RTK Query hook activates
4. Network request fires → response received → component re-renders with data

Steps 3-4 happen AFTER `waitForAuthedAppReady` resolves.

**The simple rule**: After `waitForAuthedAppReady`, add an explicit timeout on
the data-dependent element:
```js
await waitForAuthedAppReady(page, '/contact');
// Data-dependent element needs extra time for RTK Query to complete
await expect(heading).toBeVisible({ timeout: 10_000 });
```

### G5. Route Mocks Must Be Set Before Login Navigation

**What went wrong**: `page.route()` for `/api/contact/my-requests` was set
after `loginAsUser()`, so the RTK Query request fired before the mock was in
place.

**Why it happened**: `loginAsUser()` navigates to `/` and sets up auth state.
Then `waitForAuthedAppReady(page, '/contact')` navigates to `/contact`. If the
route mock is set between these calls, it works. But if `loginAsUser` itself
triggers a request to the mocked endpoint (via page navigation), the mock
misses it.

**The simple rule**: Always set `page.route()` mocks BEFORE any navigation
that could trigger the mocked request:
```js
// Good — mock before login so it's ready for any subsequent navigation
await page.route('**/api/contact/my-requests', handler);
await loginAsUser(page);
await waitForAuthedAppReady(page, '/contact');
```

### G6. Auto-Sync Staging Creates E2E Cascade Cancellation

**What went wrong**: E2E runs were cancelled mid-test, showing 0 results.

**Why it happened**: The `sync-staging.yml` workflow was triggered by the same
`repository_dispatch` event as `e2e.yml`. The cascade:
1. Merge to main → Vercel deploys server → fires `repository_dispatch`
2. Both `sync-staging` and `e2e` workflows start
3. `sync-staging` force-pushes main to staging
4. Staging push triggers a Vercel deployment
5. Staging deployment fires another `repository_dispatch`
6. A second `e2e` workflow starts
7. The `e2e-tests` concurrency group cancels the first E2E run

**The simple rule**: Never trigger a branch sync from the same event that
triggers E2E tests. Either:
- Make the sync manual (`workflow_dispatch`) — chosen approach
- Use a separate concurrency group for sync-triggered E2E runs
- Add a filter in the E2E workflow to skip staging-triggered dispatches

### G7. Redux Initial State Must Match App Lifecycle

**What went wrong**: All 14 admin tests failed because `AdminRoute` redirected
to `/` on first render, before auth could restore.

**Why it happened**: `authSlice` had `loading: false` in its initial state.
On app start, React renders immediately with this state. `AdminRoute` checks
`if (loading) return null; if (!isAuthenticated) redirect('/')`. Since
`loading` was `false` and `isAuthenticated` was also `false` (auth not yet
restored), the redirect fired instantly.

**The simple rule**: For auth-gated routes, the initial `loading` state must
be `true` — indicating "we don't know the auth state yet, don't make
decisions." Only set `loading: false` after auth initialization completes
(either authenticated or confirmed unauthenticated):
```js
const initialState = {
  loading: true,  // NOT false — prevents premature routing decisions
  isAuthenticated: false,
  // ...
};
```

---

## Part H — Auth Boundary & DTO Normalization

### H1. Unprotected sync-profile + snake_case DTO caused orphan rows and identity failures

**What went wrong**: Profile completion silently failed for users who had just
registered. The completion form submitted successfully on the client but the
server either created orphan DB rows or returned identity data the client
couldn't use.

**Why it happened** (two compounding root causes):

1. `/api/auth/sync-profile` had no `auth` middleware. The service called
   `createUser` before performing the Firebase lookup, so any failure after
   the INSERT into `users` (e.g., Firebase token invalid) left an orphan
   row in `users` — typically with no matching `user_profiles` row and no
   verified Firebase account behind it. Cleanup must target the `users`
   table (and any dangling `user_profiles` children), not `user_profiles`
   alone.
2. The service returned raw DB rows with snake_case keys (`firebase_uid`,
   `created_at`). The client read `data.user.firebase_uid` to derive identity
   for subsequent requests. After the T3/T4/T5 refactor, the client expected
   `firebaseUid` (camelCase), causing a silent `undefined` identity that
   broke all post-completion flows.

**The fix**:
- Added `auth` middleware to the `/sync-profile` route. The controller now
  reads identity from `req.user.uid` (token-derived), never from the request
  body.
- Introduced `mapUserRow` in the auth service to normalize DB snake_case to
  camelCase at the service boundary before any response is built.
- The client's sync payload no longer includes `firebaseUid` — the server
  derives it from the verified token.

**The simple rule**:
- Always protect identity-mutating endpoints with auth middleware — never
  rely on body-supplied UIDs.
- Normalize DB shapes at the **service boundary** via a dedicated mapper
  (`mapUserRow`). Raw DB column names (`snake_case`) must never reach API
  responses or Redux state.
- Verify Firebase identity server-side on every write. Never call
  `createUser` before the Firebase lookup succeeds.

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
9. If "modal intercepts pointer events" — auth race condition (F1), check if
   `waitForAuthedAppReady` is used after login + navigation
10. If `loginAs` fails with "isProfileComplete: false" — check DB seed (F6),
    verify `user_profiles` table has rows for E2E test users
11. If admin dashboard never renders — check `waitForDashboardReady` diagnostic
    logs for URL, body text, and API responses (F3)
11a. If profile completion redirects back to the completion form after submit —
    check that `auth` middleware is on `/api/auth/sync-profile` and that
    `mapUserRow` normalizes the response to camelCase before it reaches Redux (H1)
12. If "strict mode violation" on selectors — scope to nearest container (F4)
13. If `getByRole('link')` or `getByRole('tab')` times out on Bootstrap Nav —
    check parent context: standalone Nav has no ARIA role, use `.nav-link` (G1)
14. If `getByText` doesn't match — check case sensitivity, use exact case (G2)
15. If `getByRole('listitem')` fails on Bootstrap ListGroup — use
    `.list-group-item` CSS selector (G3)
16. If data-dependent elements missing after auth — add explicit timeout,
    RTK Query fires after `waitForAuthedAppReady` returns (G4)
17. If E2E run cancelled mid-test — check for cascade from staging sync (G6)
