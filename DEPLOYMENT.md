# Deployment Guide

Step-by-step instructions for deploying the Ichnos Protocol website to production.

---

## 1. Prerequisites

| Service                  | Purpose                                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| **Vercel account**       | Hosting — two projects: `ichnos-client` (frontend) and `ichnos-server` (backend)                                  |
| **Neon Tech PostgreSQL** | Relational database for customer requests, users, and structured data                                             |
| **Firebase project**     | Authentication (Email/Password), Firestore (knowledge base), Storage (file uploads), Admin SDK (server-side auth) |
| **xAI API key**          | Grok-powered RAG chatbot                                                                                          |
| **Resend account**       | Transactional email for admin digest notifications                                                                |

---

## 2. Environment Variables

### Server

Copy the example file and fill in your values:

```bash
cp server/.env.example server/.env
```

See `server/.env.example` for the full list of required variables. For production, set these in the Vercel project settings (not committed to the repo).

### Client

```bash
cp client/.env.example client/.env
```

See `client/.env.example` for the full list of required variables. For production, set these in the Vercel project settings. All client variables must be prefixed with `VITE_`.

---

## 3. Database Setup

1. Create a Neon PostgreSQL database and copy the connection string.
2. Set `DATABASE_URL` in your environment.
3. Run all migration files **in numerical order**:

```bash
psql $DATABASE_URL -f server/migrations/000_20260215_create_helpers.sql
psql $DATABASE_URL -f server/migrations/001_20260215_create_users.sql
psql $DATABASE_URL -f server/migrations/002_20260215_create_user_profiles.sql
psql $DATABASE_URL -f server/migrations/003_20260215_create_contact_requests.sql
psql $DATABASE_URL -f server/migrations/004_20260215_create_questions.sql
psql $DATABASE_URL -f server/migrations/005_20260215_create_question_topics.sql
```

4. After each migration, insert the filename into `schema_migrations`:

```sql
INSERT INTO schema_migrations (filename) VALUES ('000_20260215_create_helpers.sql');
-- Repeat for each migration file
```

5. Verify all migrations are tracked:

```sql
SELECT * FROM schema_migrations ORDER BY id;
```

See `server/migrations/README.md` for the full migration convention and tracking details.

---

## 4. Firebase Setup

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable the **Email/Password** authentication provider under Authentication → Sign-in method.
3. Go to **Project Settings → Service Accounts → Generate new private key**. This produces a JSON file containing the values for:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_STORAGE_BUCKET`
4. Set initial super-admin custom claims for the first admin user (after they sign up via the app):

```javascript
// Using the Firebase Admin SDK
admin.auth().setCustomUserClaims(uid, { admin: true, superAdmin: true });
```

The `uid` is visible in Firebase Console → Authentication → Users.

---

## 5. Firestore Setup

1. In the Firebase Console, create a Firestore database in **production mode**.
2. Create the `knowledge_base` collection.
3. Seed initial documents (requires `FIREBASE_*` env vars set locally):

```bash
node server/scripts/seedKnowledgeBase.js
```

---

## 6. Vercel Deployment

### One-Time Project Setup

1. Create a Vercel project named `ichnos-server`.
   - Set the **root directory** to `server/`.
   - Add all server environment variables in Vercel project settings.
2. Create a second Vercel project named `ichnos-client`.
   - Set the **root directory** to `client/`.
   - Add all client environment variables in Vercel project settings.
3. Disable Vercel Git auto-deploy (`"git": { "deploymentEnabled": false }` in both `vercel.json` files).

### Production Deployments (Default Path)

All production deployments are driven exclusively by GitHub Actions workflows. Do **not** use `vercel --prod` for routine releases.

1. Push changes to a feature branch and open a PR.
2. CI runs lint, tests, and builds. Preview deployments are created automatically.
3. E2E tests run against preview URLs.
4. After merge to `main`, use the **Promote to Production** workflow (with approval gate) to deploy.

See [`DEPLOYMENT_GITHUB_ACTIONS.md`](DEPLOYMENT_GITHUB_ACTIONS.md) for the full pipeline setup and details.

### Emergency Manual Fallback (CLI)

> **Use only when GitHub Actions is unavailable or broken.** These commands bypass CI, E2E, and approval gates — any change deployed this way has not been validated by the standard pipeline.

```bash
cd server && vercel --prod
cd client && vercel --prod
```

---

## 7. Vercel Cron Jobs

### What is a Cron Job?

A cron job is a **scheduled task** that runs automatically at defined intervals — like an alarm clock for your server. Instead of a person manually triggering an action, the system does it on a timer. Examples: sending a daily email summary, cleaning up old data every week.

In **Vercel**, cron jobs work like this:

1. You define a schedule and a URL path in `server/vercel.json`.
2. At each scheduled time, Vercel sends an HTTP request to that URL path.
3. Your serverless function at that path runs the task and responds.

### Cron Schedule Syntax

Schedules use the standard cron format with five fields:

```
┌─── minute (0–59)
│ ┌─── hour (0–23)
│ │ ┌─── day of month (1–31)
│ │ │ ┌─── month (1–12)
│ │ │ │ ┌─── day of week (0–6, Sunday = 0)
│ │ │ │ │
* * * * *
```

Examples:

- `0 9 * * *` → every day at 09:00 UTC
- `0 2 * * 0` → every Sunday at 02:00 UTC
- `*/15 * * * *` → every 15 minutes

### Active Scheduled Jobs

Both cron jobs are configured in `server/vercel.json` and their route handlers are implemented in `server/src/routes/adminRoutes.js`.

| Job             | Method | Path                              | Schedule    | Description                                                       |
| --------------- | ------ | --------------------------------- | ----------- | ----------------------------------------------------------------- |
| Retention Sweep | GET    | `/api/admin/retention-sweep`      | `0 2 * * 0` | Every Sunday at 02:00 UTC — anonymizes users inactive > 24 months |
| Email Digest    | GET    | `/api/admin/notifications/digest` | `0 9 * * *` | Every day at 09:00 UTC — sends new inquiry digest to admins       |

### Securing Cron Endpoints with `CRON_SECRET`

Anyone who knows your endpoint URL could call it. To prevent unauthorized access, Vercel uses a shared secret:

1. **You generate a random secret** (a long, random string). You do **not** need a separate account — just run this command in your terminal:

   ```bash
   openssl rand -hex 32
   ```

   This outputs a 64-character random hex string, for example: `a3f8c1d9e4b7...` (keep the full string).

   Alternative methods if `openssl` is not available:

   ```bash
   # Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # Python
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

2. **Add the secret to Vercel**:
   - Go to **Vercel Dashboard → server project → Settings → Environment Variables**.
   - Click **Add New**.
   - **Key**: `CRON_SECRET`
   - **Value**: paste the random string you generated.
   - **Environments**: select **Production** (and optionally **Preview** for testing).
   - Click **Save**.

3. **How it works at runtime**:
   - Vercel invokes cron endpoints via `GET` requests.
   - Your cron middleware reads the `Authorization` header, extracts the Bearer token, and compares it to `process.env.CRON_SECRET`.
   - If they match, the request is legitimate — proceed with the task (Firebase auth is bypassed).
   - If they don't match (or the header is missing), the middleware falls through to the Firebase auth + admin chain. If that also fails, the request is rejected with `401 Unauthorized`.

4. **Example middleware** (implemented in `server/src/middleware/cronAuth.js`):

   ```javascript
   export default function cronOrAdmin(req, res, next) {
     const cronSecret = process.env.CRON_SECRET;
     const authHeader = req.headers.authorization || "";
     const token = authHeader.startsWith("Bearer ")
       ? authHeader.slice(7)
       : null;

     if (cronSecret && token === cronSecret) {
       return next();
     }

     auth(req, res, (authErr) => {
       if (authErr) return next(authErr);
       admin(req, res, next);
     });
   }
   ```

### Verification

Once the cron jobs are active:

- **Dashboard**: Vercel Dashboard → server project → **Cron Jobs** tab shows all registered jobs, their schedule, and execution history.
- **Manual trigger**: Use the **Run Now** button in the Vercel dashboard to test a job immediately.
- **Logs**: Check Vercel Dashboard → server project → **Functions → Logs** to see cron execution output and errors.

---

## 8. Initial Admin Setup

After the first deployment:

1. Sign up via the app UI to create a Firebase user.
2. Find the Firebase UID in Firebase Console → Authentication → Users.
3. Set custom claims (admin + superAdmin) using the Firebase Admin SDK:

```javascript
admin.auth().setCustomUserClaims(uid, { admin: true, superAdmin: true });
```

4. The user must **sign out and sign back in** for the new claims to take effect (ID token refresh).

---

## 9. First Rollout Validation Checklist

### One-Time Setup Verification

Do once before first deploy:

- [ ] GitHub `production` environment exists with at least one required reviewer configured
- [ ] All required repository secrets are set (see [`DEPLOYMENT_GITHUB_ACTIONS.md` §3.2](DEPLOYMENT_GITHUB_ACTIONS.md#32-required-repository-secrets) for the full list including `VERCEL_STAGING_ALIAS_CLIENT` and `VERCEL_STAGING_ALIAS_SERVER`)
- [ ] GitHub rulesets/branch protections are configured for `e2e-testing`, `staging`, and `main` with the correct required check names (see [`DEPLOYMENT_GITHUB_ACTIONS.md` §3.3](DEPLOYMENT_GITHUB_ACTIONS.md#33-required-checks-per-branch))
- [ ] Vercel Git auto-deploy is disabled (`"git": { "deploymentEnabled": false }` in both `vercel.json` files)
- [ ] Stable staging alias hostnames are registered in Vercel Dashboard → each project → Settings → Domains
- [ ] Production environment variables are set in Vercel project settings for both `ichnos-client` and `ichnos-server` (never committed to the repo)

### Daily Flow Verification

After each deployment cycle:

- [ ] **CI checks**: `Client — Lint & Test` and `Server — Lint & Test` are green on the PR
- [ ] **Preflight check**: `Preflight — Secret Validation` is green (confirms all secrets are present and PR is not from a fork)
- [ ] **Preview deployments**: `Deploy Client Preview` and `Deploy Server Preview` completed successfully; preview URLs are accessible
- [ ] **E2E gate**: `E2E Tests (Playwright)` passed on the PR
- [ ] **Staging alias**: After merge to `staging`, visit the stable staging client URL (`VERCEL_STAGING_ALIAS_CLIENT`) and confirm it reflects the latest merged changes
- [ ] **Staging alias atomicity**: Check the `Staging Alias Sync` workflow run summary — both client and server aliases must show `SUCCESS`; if the summary shows `FAILED`, do not proceed to `staging → main` PR until aliases are manually verified
- [ ] **Production approval**: After merging to `main`, confirm the `Promote to Production` workflow is waiting for approval in GitHub → Actions → Environments → production
- [ ] **Production deploy**: After approving, confirm both client and server production deployments completed successfully in the workflow summary
- [ ] **App smoke test**: Auth (sign up, log in, log out), Chat (send message, receive AI response), Contact form (submit inquiry, verify it appears in admin dashboard), Admin dashboard (update a request status), Cron jobs (visible in Vercel Dashboard → Cron Jobs tab)

> ⚠️ **Fail-fast secret policy**: On PRs targeting `e2e-testing` or `staging`, missing secrets cause an immediate pipeline failure — there is no silent skip. If `Preflight — Secret Validation` fails, check that all secrets listed in [`DEPLOYMENT_GITHUB_ACTIONS.md` §3.2](DEPLOYMENT_GITHUB_ACTIONS.md#32-required-repository-secrets) are set in **Settings → Secrets and variables → Actions**.

---

## 10. Monitoring

| Service              | Where to Monitor                                                        |
| -------------------- | ----------------------------------------------------------------------- |
| **Vercel logs**      | Dashboard → server project → Functions → Logs (filter by function name) |
| **xAI usage**        | xAI dashboard or API usage endpoint                                     |
| **Resend delivery**  | Resend dashboard → Emails tab                                           |
| **Neon performance** | Neon console → Monitoring tab (query latency, connection count)         |

---

## 11. Migration Naming Convention & Tracking

Migration files follow the naming convention: `NNN_YYYYMMDD_description.sql`

Each applied migration is tracked in the `schema_migrations` table. See `server/migrations/README.md` for full details on the convention and tracking workflow.
