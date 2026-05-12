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
