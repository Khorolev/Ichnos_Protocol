# Environment Variables Refactor Plan

> Single source of truth for all config. Separate real secrets from visible config.
> Designed for Traycer execution in small verifiable increments.

## Problem Statement

The project has ~40 unique env vars scattered across 5+ platforms (local .env files,
GitHub Secrets, GitHub Variables, Vercel client project, Vercel server project). Many
non-sensitive values (test emails, UIDs, Firebase project IDs) are stored as GitHub
Secrets (write-only, invisible, impossible to verify). This caused 2 weeks of debugging
where a single mismatched API key silently broke all authenticated E2E tests.

## Design Principles

1. **Committed config files are the source of truth** for non-sensitive values
2. **Secrets are only for values that would cause harm if exposed** (private keys, passwords, API keys with billing)
3. **The workflow reads from committed files**, not from platform env vars, wherever possible
4. **One file per environment**, checked into the repo
5. **Env var names are consistent** across all files and platforms

## Classification: What Is Actually Secret?

### Truly Secret (keep as GitHub Secrets / Vercel env vars)
| Variable | Why |
|----------|-----|
| `FIREBASE_PRIVATE_KEY` | Service account private key — full admin access |
| `DATABASE_URL` | Contains DB password — full data access |
| `XAI_API_KEY` | Billed API key |
| `RESEND_API_KEY` | Billed email API key |
| `CRON_SECRET` | Protects cron endpoints |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Bypasses deployment protection |
| `E2E_ADMIN_PASSWORD` | Test account passwords (low risk but keep private by convention) |
| `E2E_USER_PASSWORD` | Same |
| `E2E_SUPER_ADMIN_PASSWORD` | Same |
| `E2E_MANAGE_ADMIN_TARGET_PASSWORD` | Same |

### NOT Secret (move to committed config files)
| Variable | Why it's safe |
|----------|--------------|
| `E2E_ADMIN_EMAIL` | Test account email — no value to an attacker |
| `E2E_USER_EMAIL` | Same |
| `E2E_SUPER_ADMIN_EMAIL` | Same |
| `E2E_MANAGE_ADMIN_TARGET_EMAIL` | Same |
| `E2E_ADMIN_UID` | Firebase UID — public in any authenticated request |
| `E2E_USER_UID` | Same |
| `E2E_SUPER_ADMIN_UID` | Same |
| `E2E_MANAGE_ADMIN_TARGET_UID` | Same |
| `FIREBASE_API_KEY` (test project) | Firebase API keys are designed to be public (restricted by domain) |
| `VITE_FIREBASE_*` (all 6) | Public client config — visible in the JS bundle anyway |
| `FIREBASE_PROJECT_ID` | Public |
| `FIREBASE_CLIENT_EMAIL` | Service account email — not a credential |
| `FIREBASE_STORAGE_BUCKET` | Public |
| `E2E_BASE_URL` | URL — already a GitHub Variable |
| `E2E_API_BASE_URL` | URL — already a GitHub Variable |
| `CORS_ORIGIN` | URL config |
| `VITE_API_HOST` | URL config |
| `CONTACT_CONSENT_TEXT` | Legal text |
| `CONTACT_CONSENT_VERSION` | Version string |
| `PRIVACY_POLICY_URL` | Public URL |

## Target Architecture

### Committed Config Files (source of truth)

```
repo/
├── e2e/
│   └── .env.e2e              # E2E test config (committed)
│       ├── Test user emails, UIDs
│       ├── Test Firebase API key
│       └── Test Firebase project config
├── client/
│   ├── .env.example           # Template (committed)
│   ├── .env                   # Local dev (gitignored)
│   └── .env.test              # Unit test stubs (committed)
├── server/
│   ├── .env.example           # Template (committed)
│   └── .env                   # Local dev (gitignored)
└── .env.e2e                   # Root E2E config (committed) — RENAME to e2e/.env.e2e
```

### `e2e/.env.e2e` (committed — the single source of truth for E2E)

```env
# Test Firebase project — these are public (visible in the JS bundle)
FIREBASE_API_KEY=af7f7c29c07b916809e114beff9a38362afd9172
FIREBASE_PROJECT_ID=ichnos-protocol-test
FIREBASE_AUTH_DOMAIN=ichnos-protocol-test.firebaseapp.com
FIREBASE_STORAGE_BUCKET=ichnos-protocol-test.firebasestorage.app

# Test user accounts (emails + UIDs are not sensitive)
E2E_ADMIN_EMAIL=e2e-admin@ichnos-test.com
E2E_ADMIN_UID=3aJeVpbzbsQZZMvHOLsGbDQI2353
E2E_USER_EMAIL=e2e-user@ichnos-test.com
E2E_USER_UID=dyaXhqz6BvOR0k3t8Lb7q8G4zO22
E2E_SUPER_ADMIN_EMAIL=e2e-superadmin@ichnos-test.com
E2E_SUPER_ADMIN_UID=CTTDUTkYSYURhwxaOCiVUZW2xch1
E2E_MANAGE_ADMIN_TARGET_EMAIL=e2e-manage-target@ichnos-test.com
E2E_MANAGE_ADMIN_TARGET_UID=l0p4WsPomjV3YR58BrakwqRQ6F82

# E2E target URLs
E2E_BASE_URL=https://e2e-client.ichnos-protocol.com
E2E_API_BASE_URL=https://e2e-api.ichnos-protocol.com
```

### GitHub Secrets (only truly secret values)

| Secret | Description |
|--------|-------------|
| `E2E_ADMIN_PASSWORD` | Test admin password |
| `E2E_USER_PASSWORD` | Test user password |
| `E2E_SUPER_ADMIN_PASSWORD` | Test super-admin password |
| `E2E_MANAGE_ADMIN_TARGET_PASSWORD` | Test manage-admin password |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Deployment protection bypass |

### GitHub Variables (remove — replaced by committed file)

All current GitHub Variables (`E2E_BASE_URL`, `E2E_API_BASE_URL`) are moved into the
committed `e2e/.env.e2e` file. The workflow reads from the file instead of `vars.*`.

### Vercel Env Vars (platform-specific — cannot be replaced by committed files)

Vercel env vars are resolved at build time (VITE_*), edge routing ($VAR in routes),
or server runtime (process.env). They MUST stay on the Vercel platform because:
- VITE_* are injected by Vite at build time from the Vercel build environment
- $VITE_API_HOST is expanded by Vercel's edge routing layer (vercel.json routes)
- DATABASE_URL is auto-injected per-branch by the Neon-Vercel integration
- Server runtime vars are read by process.env in the serverless function

**Branch scoping is critical** — `main` (E2E) and `staging` (QA) need different values.

#### Vercel Client Project (`ichnos-protocol`)

Three scopes: Production, Preview/main (E2E), Preview/staging (QA).

| Variable | Production | Preview/main (E2E) | Preview/staging (QA) |
|----------|-----------|-------------------|---------------------|
| `VITE_FIREBASE_API_KEY` | Production key | **Test key** (`af7f7c...`) | Production key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `ichnos-protocol.firebaseapp.com` | `ichnos-protocol-test.firebaseapp.com` | `ichnos-protocol.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `ichnos-protocol` | `ichnos-protocol-test` | `ichnos-protocol` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `ichnos-protocol.firebasestorage.app` | `ichnos-protocol-test.firebasestorage.app` | `ichnos-protocol.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Production value | Test value | Production value |
| `VITE_FIREBASE_APP_ID` | Production value | Test value | Production value |
| `VITE_API_HOST` | `ichnos-protocolserver.vercel.app` | `e2e-api.ichnos-protocol.com` | `staging-api.ichnos-protocol.com` |
| `VITE_CALENDLY_LINK` | Production link | Same | Same |

**Key rule**: Every `VITE_FIREBASE_*` var needs THREE entries in Vercel:
1. Production scope
2. Preview scope, branch: `main` (test Firebase)
3. Preview scope, branch: `staging` (production Firebase)

If any var is set to "Preview (all branches)" without branch scoping, main and staging
get the same value → E2E tests break.

#### Vercel Server Project (`ichnos-protocolserver`)

| Variable | Production | Preview/main (E2E) | Preview/staging (QA) |
|----------|-----------|-------------------|---------------------|
| `DATABASE_URL` | Production Neon | Auto by Neon integration (ephemeral) | Production Neon (manual override) |
| `FIREBASE_PROJECT_ID` | `ichnos-protocol` | `ichnos-protocol-test` | `ichnos-protocol` |
| `FIREBASE_PRIVATE_KEY` | Production key | **Test project key** | Production key |
| `FIREBASE_CLIENT_EMAIL` | Production email | Test email | Production email |
| `FIREBASE_STORAGE_BUCKET` | Production bucket | Test bucket | Production bucket |
| `CORS_ORIGIN` | `https://ichnos-protocol.com` | `https://e2e-client.ichnos-protocol.com` | `https://staging-client.ichnos-protocol.com` |
| `E2E_ADMIN_EMAIL` | Not set | `e2e-admin@ichnos-test.com` | Not set |
| `E2E_ADMIN_UID` | Not set | Current UID from provision | Not set |
| `E2E_USER_EMAIL` | Not set | `e2e-user@ichnos-test.com` | Not set |
| `E2E_USER_UID` | Not set | Current UID | Not set |
| `E2E_SUPER_ADMIN_EMAIL` | Not set | `e2e-superadmin@ichnos-test.com` | Not set |
| `E2E_SUPER_ADMIN_UID` | Not set | Current UID | Not set |
| `SKIP_E2E_SEED` | Not set | **Not set** (seed must run) | `true` (skip seed) |
| `XAI_API_KEY` | Production key | Same or test key | Same |
| `RESEND_API_KEY` | Production key | Same or disabled | Same |
| `CRON_SECRET` | Production secret | Same | Same |
| `ADMIN_EMAILS` | Production list | Test admin emails | Production list |
| `NODE_ENV` | `production` | `production` | `production` |

**Key rules for server**:
- `CORS_ORIGIN` MUST be branch-scoped — main allows `e2e-client`, staging allows `staging-client`
- `FIREBASE_*` (Admin SDK) must point to the test project for main, production for staging
- `SKIP_E2E_SEED=true` only on staging, never on main
- `E2E_*_UID` vars are only needed on main (for the seed script)

#### Production/Release Scope

Production deployments happen when code is promoted (Vercel auto-deploys the default
branch or via manual promotion). Production env vars use the real Firebase project,
real database, and real API keys. No E2E vars are set in production scope.

**Release workflow**: The current flow is main → staging → production.
- E2E tests validate on `main` (test Firebase + ephemeral DB)
- Manual QA on `staging` (production Firebase + production DB)
- Production promotion only after both pass

#### Vercel Domain Mapping

| Domain | Vercel Project | Git Branch | Purpose |
|--------|---------------|------------|---------|
| `ichnos-protocol.com` | Client | Production | Live site |
| `www.ichnos-protocol.com` | Client | Production | Live site (redirect) |
| `e2e-client.ichnos-protocol.com` | Client | `main` | E2E testing |
| `staging-client.ichnos-protocol.com` | Client | `staging` | Manual QA |
| `ichnos-protocolserver.vercel.app` | Server | Production | Live API |
| `e2e-api.ichnos-protocol.com` | Server | `main` | E2E testing |
| `staging-api.ichnos-protocol.com` | Server | `staging` | Manual QA |

#### Deployment Protection

Both client and server Vercel projects must have "Protection Bypass for Automation"
enabled with the same secret (`VERCEL_AUTOMATION_BYPASS_SECRET`). This applies to ALL
preview deployments regardless of branch.

## Workflow Changes

### Current (broken pattern)
```yaml
# e2e.yml reads from 5+ sources
FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}     # ← might not match client build
E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}       # ← invisible, can't verify
E2E_BASE_URL: ${{ vars.E2E_BASE_URL }}                # ← separate from code
```

### Target (single source of truth)
```yaml
# e2e.yml reads committed file + only passwords from secrets
- name: Load E2E config from committed file
  run: |
    set -a
    source e2e/.env.e2e
    set +a
    # Overlay passwords from secrets (the only truly secret values)
    echo "E2E_ADMIN_PASSWORD=${{ secrets.E2E_ADMIN_PASSWORD }}" >> $GITHUB_ENV
    echo "E2E_USER_PASSWORD=${{ secrets.E2E_USER_PASSWORD }}" >> $GITHUB_ENV
    echo "E2E_SUPER_ADMIN_PASSWORD=${{ secrets.E2E_SUPER_ADMIN_PASSWORD }}" >> $GITHUB_ENV
    echo "E2E_MANAGE_ADMIN_TARGET_PASSWORD=${{ secrets.E2E_MANAGE_ADMIN_TARGET_PASSWORD }}" >> $GITHUB_ENV
    echo "VERCEL_AUTOMATION_BYPASS_SECRET=${{ secrets.VERCEL_AUTOMATION_BYPASS_SECRET }}" >> $GITHUB_ENV
```

### Key benefit
The `FIREBASE_API_KEY` in the committed file is guaranteed to match the one baked into
the client build (since both come from the same committed config). No more mismatches.

## Implementation Phases

### Phase 1: Create `e2e/.env.e2e` as source of truth
- Move non-sensitive values from `.env.e2e` (root) to `e2e/.env.e2e`
- Remove sensitive values (passwords, private keys, DATABASE_URL)
- Commit the file (update `.gitignore` if needed)
- Files: `e2e/.env.e2e` (new), `.gitignore`

### Phase 2: Update E2E workflow to read from committed file
- Add "Load E2E config" step that sources `e2e/.env.e2e`
- Overlay passwords from GitHub Secrets
- Remove `vars.*` references (URLs now come from the file)
- Remove `secrets.*` references for non-sensitive values (emails, UIDs, API key)
- Files: `.github/workflows/e2e.yml`

### Phase 3: Update global-setup to read from committed file
- `global-setup.js` reads `FIREBASE_API_KEY` from env (set by workflow step)
- No code change needed if Phase 2 correctly exports all vars
- Verify: the `FIREBASE_API_KEY` used for localStorage injection matches the
  client build's `VITE_FIREBASE_API_KEY`

### Phase 4: Update provision script
- `provision-e2e-firebase-users.js` reads from `e2e/.env.e2e` instead of root `.env.e2e`
- Update the script's env file path
- Files: `server/scripts/provision-e2e-firebase-users.js`

### Phase 5: Clean up GitHub Secrets and Variables
- Delete non-sensitive GitHub Secrets: `E2E_ADMIN_EMAIL`, `E2E_USER_EMAIL`,
  `E2E_SUPER_ADMIN_EMAIL`, `E2E_MANAGE_ADMIN_TARGET_EMAIL`, `FIREBASE_API_KEY`,
  `E2E_ADMIN_UID`, `E2E_USER_UID`, `E2E_SUPER_ADMIN_UID`
- Delete GitHub Variables: `E2E_BASE_URL`, `E2E_API_BASE_URL` (now in committed file)
- Keep only passwords + bypass secret as GitHub Secrets

### Phase 6: Update documentation
- Update `devOpsLessonsLearned.md` with the new architecture
- Update `CLAUDE.md` Section 12 (Environment Variables)
- Add a "Configuration Quick Reference" section

## Verification Checklist (per phase)

- [ ] `npm test` passes in server/ and client/
- [ ] E2E workflow can read the committed file
- [ ] `FIREBASE_API_KEY` in global-setup matches the deployed client bundle
- [ ] All 4 test users validate in global-setup
- [ ] StorageState auth persists in the browser
- [ ] Admin tests can access /admin
- [ ] No sensitive values committed to git

## Migration Safety

Each phase is independently deployable and verifiable. If any phase breaks E2E:
1. The committed file can be edited and pushed (instant fix, no platform UI needed)
2. GitHub Secrets can be re-added as a fallback
3. The workflow can be reverted to read from secrets/vars as before
