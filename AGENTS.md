# AGENTS.md — Ichnos Protocol

## Project

Company website for Ichnos Protocol, showcasing the Battery Passport solution.
Monorepo: `client/` (React frontend) + `server/` (Express backend).

## Tech stack

| Layer        | Technology                     |
|--------------|--------------------------------|
| Frontend     | React 18+, Vite, Bootstrap 5, Redux Toolkit (RTK Query), React Router v6+ |
| Backend      | Express.js 5, REST API, ES modules |
| SQL DB       | PostgreSQL (Neon Tech)         |
| NoSQL/Files  | Firebase Firestore + Storage   |
| Auth         | Firebase Authentication        |
| Chatbot      | X.ai Grok API (RAG)           |
| LinkedIn     | Third-party embed widget       |
| Testing      | Vitest, React Testing Library, Supertest, Playwright (E2E) |
| Deployment   | Vercel (Monorepo)              |
| Linting      | ESLint + Prettier              |

## Repository structure

```
client/
  src/
    app/              # Store, providers
    components/
      atoms/           # Buttons, inputs, labels
      molecules/       # Form groups, nav items
      organisms/       # Navbar, footer, chatbot, forms
      templates/       # Page layouts (public, admin)
      pages/           # Route-level (thin wrappers)
    features/          # Redux slices + RTK Query (auth, chat, linkedin, requests, services)
    hooks/             # Custom hooks
    helpers/           # Pure utility functions
    constants/         # Config and constants
    routes/            # Route definitions and guards
  vercel.json          # Vercel frontend config (Vite, SPA rewrites)

server/
  api/
    index.js           # Vercel serverless entry point (wraps Express)
  src/
    config/            # DB, Firebase admin, env
    controllers/       # Thin route handlers
    services/          # Business logic
    repositories/      # Data access (SQL, Firestore)
    middleware/        # Auth, errors, validation
    routes/            # Express routers
    helpers/           # Pure utilities
    validators/        # Request schemas (Zod)
  vercel.json          # Vercel backend config (serverless, rewrites)
```

## Build, test & deploy commands

```bash
# Install
npm install              # from client/ or server/

# Dev
npm run dev              # start dev server (client or server)

# Lint & format
npm run lint             # ESLint
npm run format           # Prettier

# Test
npm test                 # run full test suite
npm run test -- path/to/file.test.jsx   # single file

# Build
npm run build            # production build (Vite for client, tsc/node for server)

# E2E (Playwright — run after starting client + server locally)
cd e2e && npx playwright test              # all browsers
cd e2e && npx playwright test --headed     # visible browser

# Deploy (Vercel CLI — optional, for manual deploys)
cd client && vercel --prod   # deploy frontend
cd server && vercel --prod   # deploy backend
```

## Architecture rules

### Frontend layers (Atomic Design)

- **Pages**: route entry, compose templates. No business logic or API calls.
- **Templates**: layout structure. No data fetching.
- **Organisms**: feature-level UI. Use hooks/slices for data, not direct API calls.
- **Molecules**: small composed groups. No side effects.
- **Atoms**: single-purpose primitives. Props only.

### Backend layers

- **Routes** → **Controllers** → **Services** → **Repositories**
- Each layer calls only the one below it. Never reverse.
- Controllers: parse request, delegate, respond. No business logic.
- Services: all business logic. No direct DB access.
- Repositories: all data access. No business logic.

## Code conventions

- JavaScript ES2022+. No TypeScript unless requested.
- Max file: 120 lines. Max function: 20 lines. Max JSX return: 60 lines.
- Components: `PascalCase`. Hooks: `useCamelCase`. Helpers: `camelCase`. Constants: `UPPER_SNAKE_CASE`.
- DB columns: `snake_case`. API endpoints: `kebab-case`.
- Default exports for React components (atoms, molecules, organisms, pages, templates). Named exports for utilities, hooks, constants, Redux slices, helpers, and infrastructure files (store, providers).
- Functional components only. Props destructured in signature.
- One component per file. File name matches component name.
- No inline styles. Use Bootstrap utility classes for spacing, typography, display.
- Use react-bootstrap components (`Container`, `Row`, `Col`, `Card`, `Table`, `Badge`, `Button`, etc.) for layout and UI. Import from `react-bootstrap/<Component>`.
- All API calls through RTK Query. No raw fetch/axios in components.
- Extract helpers for any logic block > 3 lines. Helpers must be pure functions.
- Extract named constants (`UPPER_SNAKE_CASE`) for configuration values used in service/API calls: model names, timeouts, batch sizes. Never use magic strings.

## Testing

### Unit, Component & API Tests (Vitest)

- **Runner**: Vitest (shares Vite's transform pipeline — no separate Babel/SWC config).
- **Client environment**: `jsdom`. **Server environment**: `node`.
- Co-locate tests: `Module.test.jsx` next to `Module.jsx`.
- Unit tests: all helpers, services, repositories.
- Component tests: React Testing Library — test interactions, not internals.
- API tests: Vitest + Supertest for endpoints.
- Coverage: `v8` provider, 80% target for helpers and services.
- Mocking: `vi.fn()`, `vi.spyOn()`, `vi.mock()`.
- Always test schema validators directly with edge cases (empty string, whitespace-only, boundary lengths) in addition to route-level tests.
- Integration tests that require external services must use `describeIf = process.env.TEST_DATABASE_URL ? describe : describe.skip` pattern and must pass (skip) in CI without secrets.
- **No conditional expects** (`vitest/no-conditional-expect`): Never place `expect()` inside `try/catch`, `if/else`, or any conditional branch. Use `.toThrowError()` with a matcher instead.
  - Anti-pattern: `try { fn(); } catch (e) { expect(e.message).toBe("fail"); }`
  - Correct: `expect(() => fn()).toThrowError(expect.objectContaining({ message: "fail" }))`

### End-to-End Tests (Playwright)

- E2E tests live in `e2e/tests/` at the repository root (separate from client/server).
- **Local**: Start client + server locally, run `cd e2e && npx playwright test`.
- **CI**: E2E is triggered by `repository_dispatch (vercel.deployment.success)` from the **server** Vercel project (`ichnos-protocolserver`) only. Repository Dispatch Events are enabled on the server project; the client project does not emit dispatches.
  - **Filter**: The workflow guards on `contains(github.event.client_payload.project.name || '', 'server')` — a safety check since only the server emits dispatches.
  - **Target URLs**: Stable E2E URLs from the committed `e2e/.env.e2e` file (`E2E_BASE_URL` for client, `E2E_API_BASE_URL` for API) — not per-deployment hash URLs.
  - **Client readiness**: The workflow polls `E2E_BASE_URL` (loaded from `e2e/.env.e2e`) to verify the client is live before running Playwright.
  - **Seed readiness**: The workflow polls `/api/health` for `seed.mode` — `seeded` and `skipped` are accepted as ready states, `failed` is terminal, `in_progress` triggers retry.
  - **Safety gate**: A fail-closed production-host denylist (exact hostname match, lowercase normalized, port removed) validates all target URLs before tests execute. Denylist constants are canonical in `e2e.yml`.
- `e2e.yml` also supports **manual/ad-hoc** runs via `workflow_dispatch`. Both trigger modes resolve target URLs from the committed `e2e/.env.e2e` file — there is no manual URL input. The same denylist safety gate applies.
- Browsers: **Chromium only** for `repository_dispatch` CI runs; **full suite** (Chromium, Firefox, WebKit) for `workflow_dispatch` manual runs; Chromium-only locally.

## Git conventions

- Conventional Commits: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `style`
- Scopes: `client`, `server`, `db`, `chat`, `auth`, `admin`, `linkedin`
- Branch per feature: `feature/<short-description>` from `main`
- `staging` is a **long-lived parallel branch** for manual QA, auto-synced from `main` by `sync-staging.yml`. It is not in the promotion chain (`feature/* → main → release` is unchanged). Never open PRs targeting `staging`.

## Security essentials

- Parameterized SQL queries only. Never interpolate user input.
- Validate all inputs server-side (Zod).
- Firebase ID tokens verified server-side on every protected request.
- Never use `dangerouslySetInnerHTML`.
- CORS restricted to frontend origin only.
- Rate limiting on public endpoints.
- File uploads: validate type + size (max 10MB, PDF/DOCX/PNG/JPG only).
- Never commit `.env` files or secrets.

## Security best practices

### Authorization: middleware, not controllers
- Authorization guards (e.g., super-admin checks) must live in **middleware**, not inside controller handler bodies.
- Each middleware in the chain should be a single-responsibility check: `auth` → `admin` → `superAdmin` → handler.
- Example: `router.post("/manage-admins", auth, admin, superAdmin, validate(...), controller.manageAdmins)`.
- Never write `if (req.user?.superAdmin !== true) return res.status(403)...` inside a controller.

### AI prompt injection prevention
- Never inject raw user-supplied text directly into AI `system` role content or as part of system instructions.
- Always place user input in the `user` role only.
- Before passing user text to topic classification or any AI system prompt, sanitize (strip control characters) and truncate to a maximum length.
- Example anti-pattern: `{ role: "system", content: `${systemPrompt} ${userMessage}` }` — do NOT do this.
- Correct pattern: `[{ role: "system", content: systemPrompt }, { role: "user", content: sanitize(message) }]`.

### HTML injection in server-rendered pages
- Always escape values interpolated into HTML templates using an `escapeHtml()` helper.
- Validate URL scheme before using a value as `href` or `src` — reject `javascript:`, `data:`, and any non-http/https protocol.
- This applies even to environment variables: env vars can be misconfigured.
- Reference implementation: `server/src/helpers/buildStatusPage.js` (`escapeHtml`, `sanitizeOrigin`).

### Firebase Admin SDK initialization guard
- Firebase Admin SDK must be initialized exactly once (singleton pattern).
- Guard initialization with `!admin.apps.length` before calling `admin.initializeApp()`.
- Never call `admin.auth()`, `admin.storage()`, or `admin.firestore()` before the app is fully initialized.
- Reference implementation: `server/src/config/firebase.js`.

## Deployment (Vercel Monorepo)

- Deployed on **Vercel** as two projects from the same repo.
- **Frontend** (`client/`): Vite static build → `dist/`. SPA rewrites to `index.html`.
- **Backend** (`server/`): Express app wrapped as a Vercel serverless function via `server/api/index.js` using `@vercel/node`.
- **Vercel Git integration handles preview deployments** automatically on every branch push and PR — no GitHub Actions workflow is involved in creating previews.
- **Enforced pipeline order**: CI → Vercel Preview (native) → E2E (Playwright via `repository_dispatch (vercel.deployment.success)`) → approval-gated production promotion.
- `repository_dispatch (vercel.deployment.success)` events from the **server** Vercel project (`ichnos-protocolserver`) trigger `e2e.yml`. The workflow uses project-name filtering (`contains(project.name, 'server')`) and targets stable E2E URLs from the committed `e2e/.env.e2e` file (`E2E_BASE_URL`, `E2E_API_BASE_URL`).
- Production promotion is triggered automatically on push to `release` and requires human approval via the GitHub `production` environment before the latest validated `main` preview is promoted.
- Environment variables set in Vercel project settings, never committed.
- `server/api/index.js` only re-exports the Express app. All setup stays in `server/src/app.js`.
- **Staging manual-QA lane**: The `staging` branch produces a Vercel Preview deployment that uses **production Firebase** and **production Neon DB** via branch-scoped env overrides. `SKIP_E2E_SEED=true` prevents automated seed injection. Manual QA actions on `staging` write to the production database — this is explicitly accepted.
- `sync-staging.yml` force-pushes `main` to `staging` after every server deployment (unconditional, same `repository_dispatch` trigger as `e2e.yml`, runs in parallel). Uses `SYNC_PAT` (not `GITHUB_TOKEN`) to trigger Vercel redeployment.

## CI/CD best practices

### Integration test gating
- Integration tests that require external services (PostgreSQL, Firebase, xAI) must gate on an env var using the pattern:
  ```js
  const skip = !process.env.TEST_DATABASE_URL;
  const describeIf = skip ? describe.skip : describe;
  ```
- This ensures integration tests are silently skipped in CI when secrets are absent, not treated as errors.
- Document which secret enables each integration test suite in a comment at the top of the file.

### Schema edge-case testing
- Write unit tests for schema validators that explicitly cover edge cases: empty string, whitespace-only, too long, wrong type.
- Test at the validator level (direct Zod schema test) in addition to route-level tests.
- Edge-case tests must run in CI without any external dependencies.

### Build verification in CI
- The CI pipeline must run `npm run build` for the client as a separate step before any deployment.
- A broken Vite build should fail in CI, not only be caught at Vercel deploy time.
- Add a `build` step to `lint-and-test-client` or as a separate `build-client` job in `ci.yml`.

### Preview-first deployment model
- **Vercel's native Git integration** creates preview deployments automatically on every branch push and PR — no GitHub Actions workflow is involved.
- Production promotion is **approval-gated**: the `Promote to Production` workflow triggers automatically on push to `release` and requires human approval via the GitHub `production` environment.
- This allows reviewing every deployment on preview before it reaches users.
- Production environment should have an approval gate configured in GitHub → Settings → Environments.
- **Fork PR trust boundary**: Vercel's Git integration does not expose environment variables to builds from forks by default, preventing secret exfiltration via attacker-controlled code.
- See `DEPLOYMENT_GITHUB_ACTIONS.md` for setup instructions.
- The `staging` branch is an auto-synced parallel manual-QA lane that sits outside the automated pipeline. It uses production credentials for real-user QA. See `DEPLOYMENT_GITHUB_ACTIONS.md` for full details.

### Neon preview branches for E2E
- Vercel's native Neon integration automatically creates a Neon preview branch for each Vercel preview deployment — no GitHub Actions step provisions or deletes branches.
- E2E test data is seeded automatically by the server on preview startup. When `VERCEL_ENV === 'preview'` and E2E account env vars are present (`E2E_ADMIN_EMAIL`, `E2E_ADMIN_UID`), the server runs idempotent seed queries using its own `DATABASE_URL` (injected by the Neon-Vercel integration).
- GitHub Actions does not interact with the database at all — no Neon API calls, no direct DB connections, no seed tokens.
- E2E account env vars (`E2E_ADMIN_EMAIL`, `E2E_ADMIN_UID`, etc.) must be set as Vercel server environment variables scoped to **Preview** only.
- Seeding can be suppressed by setting `SKIP_E2E_SEED=true` as a Vercel server Preview env var; `/api/health` then reports `seed.mode=skipped`.
- `/api/health` exposes `seed.mode` (enum: `seeded | skipped | in_progress | failed`) as the canonical readiness signal for CI orchestration. The backward-compatible fields (`seed.seeded`, `seed.error`, `seed.attempts`) are retained alongside it.
- For local/manual seeding outside Vercel, use `node server/scripts/seedE2EData.js`.
- The `staging` branch does **not** use an ephemeral Neon branch — it connects directly to the production Neon database via a branch-scoped `DATABASE_URL` override. Any Neon ephemeral branch auto-created for the `staging` preview is unused and expires automatically.

### E2E URL targeting in GitHub Actions
- E2E tests are triggered by `repository_dispatch (vercel.deployment.success)` from the **server** Vercel project (`ichnos-protocolserver`) via `e2e.yml`, not as a dependent job inside another workflow.
- The workflow uses **project-name filtering** (`contains(project.name, 'server')`) as the event guard — not hostname pattern matching.
- Tests target stable E2E URLs from the committed `e2e/.env.e2e` file (`E2E_BASE_URL`, `E2E_API_BASE_URL`), not per-deployment hash URLs and not secrets.
- Detection does not use `VERCEL_PROJECT_ID_CLIENT` or hostname matching.
- Both `repository_dispatch` and `workflow_dispatch` modes resolve targets from the committed `e2e/.env.e2e` file — no manual URL input is accepted.
- Production-host denylist constants (`PRODUCTION_HOSTS_CLIENT`, `PRODUCTION_HOSTS_API`) are canonical in the `e2e.yml` workflow `env` block. Updates require maintainer-reviewed PRs on the workflow file. Docs are descriptive only and must not introduce alternate policy sources.
- The denylist gate is fail-closed: empty/missing constants or unparseable URLs abort the run. Hostname matching is exact-match after lowercase normalization and port removal.
- API readiness is `seed.mode`-based: the workflow polls `/api/health` and accepts `seeded` or `skipped` as ready; `failed` triggers immediate failure.
- E2E tests must target the **client** staging URL only, never the server.
- `E2E_BASE_URL` and `E2E_API_BASE_URL` (in `e2e/.env.e2e`) point to **ephemeral preview** targets — never to the `staging` branch URL. The `staging` environment is a separate manual-QA lane with its own distinct URL and production credentials.

### Secret-conditional steps
- Any CI step that requires a secret must check for presence before running, not fail silently:
  ```bash
  if [ -n "$MY_SECRET" ]; then
    node scripts/myScript.js
  else
    echo "Skipping: MY_SECRET not set"
  fi
  ```

## MCP Servers (AI Agent Integrations)

MCP (Model Context Protocol) servers give AI agents direct access to external
services — no manual copy-paste of URLs, credentials, or API responses.

### Available servers by agent

| MCP Server | Claude Code | Traycer | What it does |
|------------|:-----------:|:-------:|-------------|
| **GitHub** | ✅ | ✅ | Repo operations: PRs, issues, commits, code search, file contents |
| **Neon** | ✅ | ✅ | PostgreSQL: SQL queries, schema inspection, branch management, migrations |
| **Vercel** | ✅ | ❌ (OAuth not supported) | Deployments: logs, env vars, project settings, promotion |
| **DBHub** | ✅ | — | Direct SQL access to Neon DB (legacy, see Neon MCP) |
| **Playwright** | ✅ | — | E2E test execution and browser automation |
| **Context7** | ✅ | — | Library/framework documentation lookup |

### When to use which

- **Debugging a deployment failure** → Vercel MCP (Claude) for logs + Neon MCP for DB state
- **Investigating a data bug** → Neon MCP to query production data directly
- **Reviewing a PR or checking CI** → GitHub MCP
- **Checking if DB tables/migrations exist** → Neon MCP (`search_objects` or `execute_sql`)
- **Looking up library API docs** → Context7 MCP

### Setup

- **GitHub MCP**: Pre-configured in Claude Code. Traycer uses remote endpoint with PAT auth.
- **Neon MCP**: Remote server at `https://mcp.neon.tech/mcp`. Auth via OAuth (Claude) or API key (Traycer). Get API key from Neon Console → Settings → API Keys.
- **Vercel MCP**: Remote server at `https://mcp.vercel.com`. Auth via OAuth (Claude Code only — Vercel restricts to approved clients). Added via `claude mcp add --transport http --scope user vercel https://mcp.vercel.com`.
- **DBHub**: Local stdio server configured in `.mcp.json` (gitignored). See CLAUDE.md §19 for setup.

## Development workflow

- One feature at a time. Branch, implement, test, review, merge, deploy.
- Each Traycer phase scoped to max 3 files.
- All tests must pass before commit.
- ESLint zero warnings, Prettier applied before commit.
- Run `npm run build` locally before opening a PR to catch Vite build errors early.
- All authorization guards go in middleware, never inline in controllers.
- All magic strings in API/service code go in named constants.
