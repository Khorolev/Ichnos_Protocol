# Deployment Migration Validation Checklist

> Triage runbook for validating the website after any major deployment or
> infrastructure migration (Vercel account/team move, Firebase project change,
> Neon DB swap, env-var refresh, etc.). Ordered by failure cascade — check
> each tier only if the previous one passes.

## When to use this

- After moving Vercel projects between accounts/teams (Hobby → Pro)
- After rotating env vars or API keys
- After changing the production domain
- After any PR that touches infrastructure config
- As the verification section for any new design or feature deploy

## Tier 0 — Integrations audit (one-time, post-migration)

**This tier runs once after migrating Vercel accounts/teams — not on every PR.** Skip it if you're just validating a regular deploy.

Vercel integrations are **scoped per team/account**. They do not follow projects when you transfer them between teams. The new team starts with **zero integrations installed**. Until you reinstall the ones you need, downstream tiers will surface bizarre symptoms: stale `DATABASE_URL` causing 401 auth failures, missing deploy notifications, broken analytics.

### Step 1 — Inventory the old account's integrations

Before disconnecting anything on the old account, screenshot **old account → Settings → Integrations**. Cross-reference against the new team's **Settings → Integrations**. Anything in the old list but not in the new = must be reinstalled.

### Step 2 — For each missing integration, do this in order

1. **Delete the stale env vars the old integration left behind on the project.** Env vars transfer with the project during a team move, so the new team's project has the old integration's variables sitting there with dead credentials. The new integration **cannot overwrite existing variables** — it errors with "Failed to set env vars" or "Request failed". For Neon specifically, delete from every environment (Production / Preview / Development):
   - `DATABASE_URL`, `PGHOST`, `PGUSER`, `PGDATABASE`, `PGPASSWORD`
   - And also if present: `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_USER`, `POSTGRES_HOST`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`

2. **Install the integration from the new team's marketplace**, not from the integration vendor's side. This matters because the OAuth flow needs to be initiated team-side, so the resulting grant is scoped to the team. Path: Vercel → team → **Settings → Integrations → Browse Marketplace** → search → **Add Integration**.

3. **Sign in to the vendor (Neon/etc.) during OAuth as a user who is also a Team Owner on Vercel**, so permissions match end-to-end.

4. **Connect to the existing vendor-side project**, do not create a new one. The wizard will ask which Neon project / Firebase project / etc. to attach. Pick the existing one.

5. **Verify env vars repopulated**: open the Vercel project → Settings → Environment Variables → confirm the integration's variables are present with recent timestamps.

6. **Redeploy the server preview** so it picks up fresh env vars. Existing preview deployments retain the env-var snapshot from when they were built. Use Vercel bot comment → three-dot menu → Redeploy.

### Step 3 — Common integrations checklist

| Integration | Reinstall after team move? | Notes |
|---|---|---|
| **Neon** (Postgres) | Yes, if used | Repopulates `DATABASE_URL` + `PG*` vars. Single most likely cause of post-migration 401s and `password authentication failed for user 'neondb_owner'` errors. |
| **GitHub** | Usually auto-done during team creation; verify | Push a commit → confirm Vercel triggers a preview build. If it doesn't, reinstall the Vercel GitHub app and grant repo access. |
| **Vercel Speed Insights / Web Analytics** | Per-project enable | Each project's Settings has its own toggle — these are not team-level. |
| **Slack / Discord / Linear deploy notifications** | Yes, if used | Reconfigure channels/recipients after reinstall. |
| **Sentry / Datadog / New Relic** | Yes, if used | API keys may also need rotating depending on vendor. |
| **Cloudflare** (DNS proxy) | Yes, if used as a Vercel integration | DNS records themselves don't change. |

### Step 4 — What does NOT need a Vercel integration reinstall

These are env-var-only or browser-side and survive any Vercel-team move untouched:

- Firebase Auth (uses env vars + JWKS endpoint)
- Firebase Admin SDK / Firestore (service-account env vars on server)
- X.ai / Grok / OpenAI / any LLM API (single API-key env var)
- Calendly, LinkedIn, YouTube embeds (third-party browser widgets)
- Resend / SendGrid / any transactional email (API-key env var)

### Step 5 — When the integration install errors mid-flow

If the install wizard fails with **"Failed to set env vars"** → cause is step 1 above: stale env vars still on the project. Delete them, retry.

If the install wizard fails with **"Request failed: unknown error"** after step 1 was done → integration state is corrupted on one side. Full reset:

1. **Vendor side (e.g., Neon dashboard)**: open Integrations → find the Vercel integration → **Uninstall** completely
2. Wait 30 seconds for state to propagate
3. **Vercel side**: team → Settings → Integrations → if the vendor still appears, click → **Remove**
4. Refresh both browser tabs
5. Reinstall from the Vercel team marketplace (step 2 of "For each missing integration")
6. If the issue persists, sign out of both Vercel and the vendor, sign back in (resets OAuth session cookies that may be holding stale identity)

### Step 6 — Post-audit verification

After all integrations are reinstalled:

- [ ] Hit the server preview's `/api/health` endpoint with the Vercel bypass header. Expect `seed.mode = seeded` (or `skipped` if seeding is configured off for the env).
- [ ] Open Vercel → server project → Environment Variables → all expected integration variables present.
- [ ] Vercel → team → Integrations — list matches the old account's list.

Then proceed to Tier 1.

---

## Tier 1 — CI on GitHub Actions (≈5 min after push)

**Where**: PR → Checks tab → workflow runs

| Check | If green | If red |
|---|---|---|
| `ci.yml` (lint + tests) | → Tier 2 | Read the failing step. Lint failures = run `npm run lint --workspace client` locally on Linux/WSL (skips `.vercel/` noise). Test failures = run the specific failing test file with `npx vitest run path/to/file` and fix. |
| `release-policy-check.yml` | → Tier 2 | Usually a missing required label/title. Adjust PR metadata. |

**Skip** `promote-to-production.yml` and `sync-staging.yml` on PRs — they only run on `main` merges. Validate those after merge.

---

## Tier 2 — Vercel preview build (3-5 min after push)

**Where**: PR conversation → Vercel bot comments (one per project, client + server)

| Status | Action |
|---|---|
| Both ✅ "Visit Preview" | → Tier 3 |
| Client ❌ build failed | Click "Inspect" → check build log. Most likely: missing `VITE_FIREBASE_*` env var. Open Vercel → `ichnos-protocol/ichnos-client` → Settings → Environment Variables → Preview environment. Compare against `client/.env.example`. |
| Server ❌ build failed | Less likely (build is just bundling). If it does fail, check for missing top-level deps in `server/package.json`. |

**Quick env-var sanity check** (run from repo root once):
```
npx vercel link --cwd client && npx vercel env ls preview --cwd client
npx vercel link --cwd server && npx vercel env ls preview --cwd server
```
Cross-reference against the two `.env.example` files. Anything missing → add via Vercel UI.

---

## Tier 3 — Client preview URL loads

**Where**: Click "Visit Preview" on the Vercel client bot comment.

| Symptom | Likely cause | Fix |
|---|---|---|
| White page, console: `Failed to fetch dynamically imported module` | Stale CDN / build artifact | Hard refresh (Ctrl+Shift+R). If persists, redeploy. |
| Logo or static asset 404s | Asset path wrong | Verify the file is in `client/public/` (Vite serves it from root). Inspect Network tab. |
| Console: `auth/unauthorized-domain` from Firebase | **Most common post-migration issue** — preview URL hostname changed | Firebase Console → Authentication → Settings → **Authorized domains** → add the preview hostname pattern. After a team rename, the URL pattern shifts from `*-<oldusername>.vercel.app` to `*-<newteamslug>.vercel.app`. Add the new pattern, or paste the specific preview URL. |
| Page loads, theme/styles look wrong | CSS not applied | Check `client/src/index.css` was transformed in the build. View source. |

---

## Tier 4 — Routing & themes (manual walk-through)

Once the page loads, navigate every public route:

- [ ] `/` — gradient headline on dark charcoal background, single CTA
- [ ] `/services` — advisory hero, services list, **no** product (passport) sections
- [ ] `/team` — team member profiles render correctly
- [ ] `/contact` — advisory theme
- [ ] `/passport` — **distinctly different look**: Solana navy + green→purple gradient
- [ ] Footer renders across all pages with 4-column layout, battery photo background
- [ ] Navbar logo is the correct (current) brand mark
- [ ] Browser tab favicon is the correct (current) icon
- [ ] Mobile (<768px): footer stacks, navbar shows hamburger, hero headline wraps cleanly

---

## Tier 5 — Server preview API

**Where**: Vercel server bot comment → "Visit Preview" → URL will be `https://ichnos-protocolserver-<hash>.vercel.app`

| Test | Expected | If fails |
|---|---|---|
| `GET /api/health` (or whatever the sanity endpoint is) | 200 OK | Open Vercel → server preview → Function Logs. Most likely: Firebase Admin SDK init failure (missing `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` env vars). Add them to Vercel Preview env. |
| Server preview cold-start time | < 3s | If > 10s, check for heavy top-level imports in `server/api/index.js` (per CLAUDE.md §16, this file must stay thin). |

---

## Tier 6 — Cross-origin (client → server)

From the client preview, open DevTools Network tab and watch a single API call (e.g., open the chatbot widget → send a message).

| Symptom | Cause | Fix |
|---|---|---|
| Request blocked by CORS | `CORS_ORIGIN` on server doesn't include the new client preview hostname | Server → Vercel → Settings → Env Vars → Preview → set `CORS_ORIGIN` to a regex/wildcard that covers the new team's preview pattern. If your CORS middleware only takes a literal string, set it to `*` *temporarily for triage only*. |
| 401 Unauthorized | Firebase token verification failing server-side | Confirm the same `FIREBASE_PROJECT_ID` on client (`VITE_FIREBASE_PROJECT_ID`) and server. Mismatch = token never verifies. |
| API base URL wrong (e.g., calling localhost) | `VITE_API_BASE_URL` not set on client preview | Vercel → client → Settings → Env Vars → Preview → add the server preview URL pattern. |

---

## Tier 7 — Integration smoke tests

Only when Tiers 1-6 are green:

- [ ] **Chatbot**: send "What does Ichnos do?" → expect Grok-generated reply within ~5s. Failure = `XAI_API_KEY` missing or rate-limited.
- [ ] **Contact form**: submit name + email + dummy message + small PDF attachment.
  - [ ] PDF lands in Firestore → Firebase Console → Firestore → `uploads/`
  - [ ] Row appears in Neon → use Neon MCP `execute_sql` → `SELECT * FROM customer_requests ORDER BY created_at DESC LIMIT 1`
  - [ ] `document_url` column has the Firestore public URL
- [ ] **Admin login**: navigate `/admin` → login as admin → `/admin/requests` shows the row just created.
- [ ] **LinkedIn feed** on landing page: widget renders (graceful fallback acceptable — not a blocker).
- [ ] **Calendly modal**: opens, embeds correctly.

---

## Triage priorities by likelihood (post-Vercel-migration specifically)

If you only have time to verify three things first, do these in order:

1. **Firebase Auth authorized domains** — add the new Vercel team's preview-URL pattern. This is the #1 thing that breaks after a Vercel team migration. **5-minute fix in Firebase Console.**
2. **Server env vars on the new Vercel team** — `FIREBASE_*`, `DATABASE_URL`, `XAI_API_KEY`, `CORS_ORIGIN`. If they were copied during project transfer, you're already good — but verify with `vercel env ls preview --cwd server`.
3. **GitHub Actions secrets** — `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_CLIENT`, `VERCEL_PROJECT_ID_SERVER`, `VERCEL_TOKEN`. These only matter for **post-merge** workflows (`promote-to-production.yml`, `sync-staging.yml`). PRs don't use them. Defer until you're about to merge.

---

## When something breaks: where to find the answer fast

- **Vercel build logs**: PR → Vercel bot comment → "Inspect" link, OR Vercel MCP `get_deployment_build_logs`.
- **Vercel runtime logs**: Vercel dashboard → project → Functions → Logs, OR Vercel MCP `get_runtime_logs`.
- **Firebase Auth errors**: Browser console always reports the exact code (`auth/unauthorized-domain`, `auth/invalid-api-key`, etc.) — google the code.
- **Neon connection failures**: usually a stale `DATABASE_URL` pointing at a deleted branch. Use Neon MCP to list current branches.
- **CORS errors**: never lie — the browser tells you exactly which origin was rejected. Mirror that string into `CORS_ORIGIN`.

---

## Known failure patterns and their resolutions

| Failure | Tier | Root cause | One-line fix |
|---|---|---|---|
| Preview build: `Missing VITE_FIREBASE_API_KEY` | 2 | Env var didn't transfer to new team | Re-add in Vercel UI under Preview environment |
| Preview loads but login fails with `auth/unauthorized-domain` | 3 | Firebase Auth allowed domains | Add new preview URL pattern to Firebase Console |
| Chat returns 500 | 5 | `XAI_API_KEY` missing | Add to server env vars |
| Contact form upload returns 500 | 5/7 | Firebase Admin SDK init failure | Verify `FIREBASE_PRIVATE_KEY` has `\n` escaped correctly |
| API calls blocked by CORS in browser | 6 | `CORS_ORIGIN` literal string mismatch | Use a regex pattern or add the specific preview hostname |
| `promote-to-production.yml` fails after merge with "team not found" | post-merge | Stale `VERCEL_ORG_ID` GitHub secret | Update to new team ID |
| Production deploy works but DB writes fail | post-merge | Stale `DATABASE_URL` | Re-pull from Neon (new branch slug perhaps) |
| E2E client readiness step retries 36× with HTTP 401, then times out | 1 (E2E job) | `VERCEL_AUTOMATION_BYPASS_SECRET` stale, or the two Vercel projects hold *different* bypass values | The bypass secret is a single GitHub secret used to probe both `ichnos-client` and `ichnos-protocolserver`. Both Vercel projects must hold the **same** bypass value. Reveal both project bypass values in Vercel (Settings → Deployment Protection → Protection Bypass for Automation), ensure they match, then update the GitHub secret to that shared value. |
| `/api/health` returns `seed.error: password authentication failed for user 'neondb_owner'` | 5 / 7 | Neon Vercel integration not (re)installed on the new team after migration; `DATABASE_URL` env var holds dead credentials | Tier 0, Step 2 — reinstall Neon integration on the team. First delete stale `DATABASE_URL`/`PG*` env vars (the integration cannot overwrite them), then install from the team's Integrations marketplace, then redeploy the server preview. |
| Neon (or other) integration wizard fails with "Request failed: unknown error" | 0 | OAuth/integration state desync between vendor and Vercel sides | Tier 0, Step 5 — full reset: uninstall on vendor side, remove on Vercel side, refresh, reinstall from Vercel team marketplace. |

---

## Bypass secret — one secret, two projects

The E2E workflow (`.github/workflows/e2e.yml`) uses a single GitHub Actions secret
`VERCEL_AUTOMATION_BYPASS_SECRET` to authorize readiness probes against **both**
the client and the server Vercel projects.

For this to work, the two Vercel projects (`ichnos-client` and
`ichnos-protocolserver`) must each have the same string configured under
**Settings → Deployment Protection → "Protection Bypass for Automation"**.

When rotating:

1. Generate (or copy an existing) bypass value on the client project.
2. Set the **identical** value on the server project.
3. Update the `VERCEL_AUTOMATION_BYPASS_SECRET` GitHub Actions secret.

After a Vercel team transfer, Vercel may regenerate the bypass secret on one or
both projects without warning. The cheapest diagnostic when E2E suddenly starts
returning 401 is: open both Vercel projects' bypass values, confirm they match
each other and the GitHub secret, fix any drift.
