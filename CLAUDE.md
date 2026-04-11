# CLAUDE.md — Ichnos Protocol Website

> Claude-specific rules and project context for the Ichnos Protocol codebase.
> Traycer AI reads `AGENTS.md` for planning; Claude reads only this file for execution.
> Keep both files aligned — if conventions change here, update `AGENTS.md` too.

Always create yolo artifacts at the end of each task to ensure correct orchestration with planning agent

## 1. Project Overview

**Ichnos Protocol** is a company website showcasing the Ichnos Battery Passport solution.
The site includes public-facing pages (landing, team, services/products), an AI-powered chatbot for visitor engagement, a contact/document-upload flow, and an admin dashboard for managing customer requests.

### Pages

| Route             | Access | Purpose                                                        |
| ----------------- | ------ | -------------------------------------------------------------- |
| `/`               | Public | Landing page — hero, value proposition, CTA, LinkedIn feed     |
| `/team`           | Public | Team members and roles                                         |
| `/services`       | Public | Services, products, and the Battery Passport showcase          |
| `/admin/requests` | Admin  | View customer contact requests and download uploaded documents |

### Core Integrations

- **Chatbot (Grok by X.ai)** — RAG-powered assistant answering questions about the company, services, pricing, and ongoing work. Includes a contact-us flow and document upload.
- **Firebase Authentication** — User/admin authentication.
- **Firestore** — NoSQL document storage for uploaded files (returns a public URL).
- **Neon Tech PostgreSQL** — Relational database for customer contact requests. Stores a reference (public URL) to each Firestore-uploaded file.
- **LinkedIn Feed** — Latest company posts displayed on the landing page via a third-party embed widget.

---

## 2. Tech Stack

| Layer        | Technology                          | Notes                                        |
| ------------ | ----------------------------------- | -------------------------------------------- |
| Frontend     | React 18+                           | Functional components, hooks only            |
| Build Tool   | Vite                                | Dev server, HMR, production bundling         |
| UI Framework | Bootstrap 5 (react-bootstrap)       | No custom CSS frameworks on top              |
| State        | Redux Toolkit (RTK)                 | RTK Query for API calls                      |
| Routing      | React Router v6+                    |                                              |
| Backend      | Express.js 5                        | REST API, ES modules (`"type": "module"`)    |
| SQL DB       | PostgreSQL (Neon Tech)              | Accessed via `pg`                            |
| NoSQL DB     | Firestore                           | File storage + document metadata             |
| Auth         | Firebase Authentication             | JWT-based, verified server-side              |
| Chatbot      | X.ai Grok API                       | RAG integration                              |
| LinkedIn     | Third-party embed widget            | SociableKIT, Elfsight, or Juicer             |
| Testing      | Vitest + React Testing Library      | Unit + component tests; Supertest for API    |
| E2E Testing  | Playwright                          | End-to-end tests against Vercel previews     |
| Linting      | ESLint + Prettier                   | Enforced via pre-commit hook                 |
| Deployment   | Vercel (Monorepo)                   | `client/` and `server/` as separate projects |
| MCP Servers  | GitHub, Neon, Vercel, DBHub, Playwright, Context7 | Repo, DB, deployment, E2E, docs access |

---

## 3. Repository Structure

Monorepo: `client/` (React frontend) + `server/` (Express backend) + `e2e/` (Playwright).

**Key directories** (use the filesystem to explore — don't memorize):
- `client/src/components/` — Atomic Design: `atoms/`, `molecules/`, `organisms/`, `templates/`, `pages/`
- `client/src/features/` — Redux slices + RTK Query APIs (auth, chat, contact, admin, gdpr, linkedin)
- `client/src/hooks/`, `helpers/`, `constants/` — reusable logic
- `server/src/` — `controllers/` → `services/` → `repositories/` (strict layer order)
- `server/api/index.js` — Vercel serverless entry (thin wrapper, all setup in `src/app.js`)

---

## 4. Architecture Principles

### 4.1 Separation of Concerns (Strict)

Every layer has a **single responsibility**. Never mix concerns across layers.

| Frontend Layer    | Responsibility                             | Must NOT contain                    |
| ----------------- | ------------------------------------------ | ----------------------------------- |
| Pages             | Route entry, compose templates             | Business logic, direct API calls    |
| Templates         | Layout structure                           | Data fetching, state logic          |
| Organisms         | Feature-level UI blocks                    | Direct API calls (use hooks/slices) |
| Molecules         | Small composed UI groups                   | Side effects, state management      |
| Atoms             | Single-purpose UI primitives               | Any logic beyond prop rendering     |
| Hooks             | Encapsulate stateful/side-effect logic     | JSX rendering                       |
| Helpers           | Pure functions (format, compute, validate) | Side effects, hooks, state          |
| Features (slices) | Redux state + RTK Query endpoints          | UI rendering                        |

| Backend Layer | Responsibility                             | Must NOT contain                |
| ------------- | ------------------------------------------ | ------------------------------- |
| Routes        | Map HTTP verbs/paths to controllers        | Business logic, DB queries      |
| Controllers   | Parse request, call service, send response | DB queries, complex logic       |
| Services      | Business logic and orchestration           | Direct DB access, HTTP concerns |
| Repositories  | Data access (SQL and Firestore)            | Business logic, HTTP concerns   |
| Middleware    | Cross-cutting: auth, errors, validation    | Business logic                  |
| Validators    | Request schema validation (Zod)            | Business logic, DB access       |
| Helpers       | Pure utility functions                     | Side effects, DB access         |

### 4.2 SOLID Principles

- **S — Single Responsibility**: One reason to change per module. A component renders; a hook manages state; a helper computes.
- **O — Open/Closed**: Extend via composition and props, not by editing existing stable components.
- **L — Liskov Substitution**: Any component accepting a set of props must work correctly with all valid values of those props.
- **I — Interface Segregation**: Components accept only the props they use. Prefer multiple small, focused prop interfaces over a single bloated one.
- **D — Dependency Inversion**: High-level modules (services) depend on abstractions (repository interfaces), not on concrete DB drivers. In practice: controllers import services, services import repositories — never the reverse.

### 4.3 Atomic Design

Follow the Atomic Design methodology strictly:

- **Atoms**: Indivisible UI elements (`Button`, `Input`, `Label`, `Icon`, `Badge`). Accept only styling/behavioral props.
- **Molecules**: Small groups of atoms functioning as a unit (`SearchInput`, `NavItem`, `FormField`).
- **Organisms**: Complex, distinct UI sections (`Navbar`, `Footer`, `ChatbotWidget`, `ContactForm`, `TeamCard`).
- **Templates**: Page-level layouts defining the spatial arrangement of organisms (`PublicLayout`, `AdminLayout`).
- **Pages**: Route-bound components that select a template and inject data. Pages must be thin — a page component should rarely exceed 30 lines.

---

## 5. Coding Standards

### 5.1 General Rules

- **Language**: JavaScript (ES2022+). No TypeScript unless explicitly requested.
- **Max file length**: 120 lines. If a file exceeds this, refactor into smaller modules.
- **Max function length**: 20 lines. Extract helper functions.
- **Max component length**: 60 lines of JSX (return block). Decompose into smaller components if exceeded.
- **Naming**:
  - Components: `PascalCase` (`TeamCard.jsx`)
  - Hooks: `camelCase` prefixed with `use` (`useAuth.js`)
  - Helpers/utils: `camelCase` (`formatDate.js`)
  - Constants: `UPPER_SNAKE_CASE` (`API_BASE_URL`)
  - Redux slices: `camelCase` matching the feature (`authSlice.js`)
  - DB columns: `snake_case`
  - API endpoints: `kebab-case` (`/api/customer-requests`)
- **Exports**: Default exports for React components (atoms, molecules, organisms, pages, templates). Named exports for utilities, hooks, constants, Redux slices, helpers, and infrastructure files (store, providers).
- **Imports**: Group and order — (1) external libraries, (2) internal modules, (3) relative imports. Blank line between groups.

### 5.2 React Rules

- Functional components only. No class components.
- One component per file. The file name matches the component name.
- Props destructured in the function signature.
- No inline styles. Use Bootstrap utility classes or a dedicated `.module.css` when needed.
- Declare components as `export default function ComponentName({ prop1, prop2 }) {}`. No arrow-function components.
- No anonymous components (passing unnamed `() => <div>` to higher-order functions is not allowed).
- **Use react-bootstrap components** for layout and UI elements wherever a component exists: `Container`, `Row`, `Col`, `Card`, `Card.Body`, `Card.Title`, `Card.Text`, `Table`, `Badge`, `Button`, `Nav`, `Modal`, etc. Import from `react-bootstrap/<Component>` (tree-shakeable imports).
- **Keep utility classes** for spacing (`mb-3`, `py-5`), typography (`text-center`, `fw-bold`), display (`d-flex`), and other utilities that react-bootstrap does not wrap as components.
- Side effects belong in `useEffect` or custom hooks, never in render logic.
- Prefer early returns for guard clauses.

### 5.3 Redux Toolkit Rules

- One slice per feature, inside `client/src/features/<feature>/`.
- Use `createSlice` for synchronous state; `createAsyncThunk` only when RTK Query is insufficient.
- API calls go through **RTK Query** (`createApi`). Define endpoints co-located with the feature.
- No direct `fetch` or `axios` calls in components. All server communication goes through RTK Query hooks.
- Selectors live in the slice file. Use `createSelector` (reselect) for derived data.

### 5.4 Backend Rules

- Always validate incoming requests at the **route/middleware** level before reaching the controller.
- Controllers must be thin: parse, delegate, respond. No business logic.
- Services contain all business logic and orchestrate multiple repository calls when needed.
- Repositories encapsulate every database query. Raw SQL or Firestore calls never appear outside a repository.
- All async route handlers must be wrapped with an error-catching middleware (or use `express-async-errors`).
- Use HTTP status codes correctly (201 for creation, 204 for no-content, 400 for bad request, 401/403 for auth, 404, 500).

### 5.5 Helper Functions

Helpers are the primary tool for keeping code readable and short:

- Any logic block longer than **3 lines** that performs a distinct computation should be extracted into a named helper.
- Helpers must be **pure functions**: no side effects, no external state, deterministic output.
- Place shared helpers in the top-level `helpers/` directory. Place feature-specific helpers alongside their feature.
- Name helpers with a verb describing what they do (`formatCurrency`, `buildQueryParams`, `isAdminUser`).

---

## 6. Database Design

### 6.1 PostgreSQL (Neon Tech) — Relational Data

Primary use: **customer contact requests** and structured relational data.

Key table:

```sql
CREATE TABLE customer_requests (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    company       VARCHAR(255),
    message       TEXT NOT NULL,
    document_url  TEXT,                  -- Public Firestore URL (nullable)
    status        VARCHAR(50) DEFAULT 'new',
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

Rules:

- Always use parameterized queries. **Never** interpolate user input into SQL strings.
- Use migrations for schema changes (e.g., `node-pg-migrate` or Prisma Migrate).
- Store Firestore file URLs as `document_url` — this is the **single reference** linking SQL to Firestore.

### 6.2 Firestore — Document/File Storage

Primary use: **uploaded files** from the chatbot contact flow.

Collection structure:

```
uploads/
  {documentId}/
    fileName: string
    contentType: string
    uploadedBy: string (email or 'anonymous')
    publicUrl: string
    requestId: string (FK → customer_requests.id)
    createdAt: timestamp
```

Rules:

- Files are uploaded to **Firebase Storage**, metadata is stored in **Firestore**.
- After upload, retrieve the public download URL and persist it in both Firestore and the `customer_requests.document_url` column in PostgreSQL.
- Firestore security rules must restrict read access to authenticated admin users only.

---

## 7. Authentication & Authorization

- **Firebase Authentication** handles sign-in (email/password at minimum).
- On the frontend, Firebase SDK provides the ID token. Attach it as `Authorization: Bearer <token>` on every API request via an RTK Query `baseQuery` wrapper.
- On the backend, a middleware verifies the Firebase ID token using `firebase-admin` SDK. Extract `uid` and `role` from custom claims.
- **Admin role**: Set via Firebase custom claims (`{ role: 'admin' }`). Only users with this claim can access `/admin/*` routes.
- Frontend route guards: A `ProtectedRoute` component checks auth state and role before rendering admin pages. Redirect unauthenticated users to login.
- Never trust client-side role checks alone. Always verify server-side.
- **`POST /api/auth/sync-profile`** is auth-protected (Bearer token required). The `auth` middleware runs before the controller. The server derives user identity from `req.user.uid` — the verified token claim. The client must **not** send `firebaseUid` in the request body; the body carries only profile fields (`name`, `surname`, `phone`, `company`, `linkedin`).
- **Auth API response shape**: `GET /api/auth/me` returns `data.user` in camelCase: `{ firebaseUid, email, name, surname, phone, company, linkedin }`. DB snake_case keys (`firebase_uid`) are normalized via `mapUserRow` at the service layer and must never appear in API responses or Redux state.
- **`400` UX behavior**: Profile-completion validation failures return a stable generic message (`"An unexpected error occurred."`), not field-level Zod detail. This is intentional — do not change it to expose field errors.
- **Redux `auth.user`**: Always stores the canonical camelCase server shape after the T3/T4/T5 refactor. Selectors and components must reference `firebaseUid`, never `firebase_uid`.

---

## 8. Chatbot Integration (Grok / X.ai)

- The chatbot is a persistent widget (organism) rendered on all public pages.
- Conversation state lives in a Redux slice (`features/chat/`).
- Messages are sent to the backend (`POST /api/chat/message`), which proxies to the X.ai Grok API with RAG context.
- **RAG context**: The backend maintains a knowledge base (company info, services, pricing, current projects). This context is injected into the Grok API prompt alongside the user's message.
- The chatbot offers a **"Contact Us"** action that:
  1. Collects name, email, company (optional), message.
  2. Optionally allows file upload (documents for the Battery Passport or general inquiries).
  3. Uploads the file to Firestore via the backend.
  4. Creates a `customer_requests` row in PostgreSQL with the Firestore public URL.
  5. Confirms submission to the user in the chat.

---

## 9. Admin Dashboard

- Route: `/admin/requests` — protected, admin-only.
- Fetches customer requests from PostgreSQL via `GET /api/admin/customer-requests`.
- Displays a table: name, email, company, message preview, status, date, document link.
- Each row with a `document_url` has a "View" / "Download" action that opens/downloads the file from Firestore.
- Status can be updated (e.g., `new` → `in_progress` → `resolved`) via `PATCH /api/admin/customer-requests/:id`.

---

## 10. LinkedIn Feed Integration

- Third-party embed widget (SociableKIT or similar) — no direct LinkedIn API.
- `LinkedInFeed.jsx` organism wraps the widget. Load script lazily via `useEffect`.
- Widget config (container ID, data source URL) in `constants/` or env vars, not hardcoded.
- Graceful fallback: "Follow us on LinkedIn" link if widget fails to load.
- Feature directory: `features/linkedin/`.

---

## 11. API Design

All endpoints are prefixed with `/api`.

| Method | Endpoint                           | Auth   | Description                        |
| ------ | ---------------------------------- | ------ | ---------------------------------- |
| POST   | `/api/chat/message`                | Public | Send a chat message, receive reply |
| POST   | `/api/contact`                     | Public | Submit a contact request           |
| POST   | `/api/contact/upload`              | Public | Upload a document (multipart)      |
| GET    | `/api/admin/customer-requests`     | Admin  | List all customer requests         |
| GET    | `/api/admin/customer-requests/:id` | Admin  | Get a single request with details  |
| PATCH  | `/api/admin/customer-requests/:id` | Admin  | Update request status              |

Rules:

- Return consistent JSON shape: `{ data, error, message }`.
- Use plural nouns for resource collections.
- Validate all inputs. Return 400 with descriptive errors on failure.
- Paginate list endpoints (default 20, max 100).

---

## 12. Environment Variables

- **Never commit `.env` files.** All secrets live in `.env` files (gitignored).
- Check `client/.env.example` and `server/.env.example` for the canonical list of required variables.
- When introducing a new env var, update the corresponding `.env.example` in the same commit.
- Client vars are prefixed with `VITE_` (exposed at build time). Server vars are runtime-only.
- GitHub Actions secrets, Vercel env vars, and local `.env` files are three separate environments — see `AGENTS.md` and `devOpsLessonsLearned.md` for the full credential mapping.

---

## 13. Security

- **Input validation**: Validate and sanitize every user input on the server (use Zod).
- **SQL injection**: Parameterized queries only. Never concatenate user input into SQL.
- **XSS**: React escapes by default. Never use `dangerouslySetInnerHTML`.
- **CORS**: Restrict to the frontend origin only.
- **Rate limiting**: Apply `express-rate-limit` to public endpoints, especially `/api/chat/message` and `/api/contact`.
- **File uploads**: Validate file type and size on both client and server. Max 10MB. Allow only specific MIME types (PDF, DOCX, PNG, JPG).
- **Auth tokens**: Verify Firebase ID tokens server-side on every protected request. Never store tokens in localStorage — use httpOnly cookies or in-memory storage.
- **Helmet**: Use `helmet` middleware for HTTP security headers.
- **Dependencies**: Run `npm audit` regularly. No packages with known critical vulnerabilities.

---

## 14. Testing Strategy

### 14.1 Test Runner: Vitest

**Vitest** is the test runner for both `client/` and `server/`. It shares the Vite transform pipeline, so JSX, ESM, and path aliases work without extra configuration.

- Configuration lives in `vite.config.js` (client) or a dedicated `vitest.config.js` (server) using `defineConfig` from `vitest/config`.
- Use `vi.fn()`, `vi.spyOn()`, `vi.mock()` for mocking (Vitest's API, compatible with Jest patterns).
- Environment: `jsdom` for client tests (set via `environment: 'jsdom'` in config), `node` for server tests.
- Coverage provider: `v8` (built-in). Run with `npm run test -- --coverage`.

### 14.2 Test Types

| Type          | Scope                    | Tool                           | Location                                    |
| ------------- | ------------------------ | ------------------------------ | ------------------------------------------- |
| **Unit**      | Helpers, services, repos | Vitest                         | Co-located: `Module.test.js` next to module |
| **Component** | React components         | Vitest + React Testing Library | Co-located: `Component.test.jsx`            |
| **API**       | Express endpoints        | Vitest + Supertest             | Co-located: `route.test.js` next to route   |
| **E2E**       | Full user flows          | Playwright                     | `e2e/` directory at repository root         |

### 14.3 Unit, Component, and API Tests

- **Unit tests**: All helpers, services, and repositories must have unit tests.
- **Component tests**: Use React Testing Library. Test user interactions, not implementation details.
- **API tests**: Use Supertest for endpoint integration tests. Import the Express app directly, no running server needed.
- **Test file location**: Co-locate test files with the module they test (`Button.test.jsx` next to `Button.jsx`).
- **Naming**: `<ModuleName>.test.js` or `<ModuleName>.test.jsx`.
- **Coverage target**: Minimum 80% line coverage for helpers and services.
- **Run tests before every commit**. A failing test suite blocks the commit.
- **No conditional expects** (`vitest/no-conditional-expect`): Never place `expect()` inside `try/catch`, `if/else`, or any conditional branch. This hides test failures when the expected branch is not reached.
  - **Anti-pattern**:
    ```js
    try {
      await fn();
    } catch (e) {
      expect(e.message).toBe("fail");
    }
    ```
  - **Correct pattern**:
    ```js
    expect(() => fn()).toThrowError(
      expect.objectContaining({ message: "fail" }),
    );
    // For async functions:
    await expect(() => fn()).rejects.toThrowError(
      expect.objectContaining({ message: "fail" }),
    );
    ```

### 14.4 End-to-End Testing: Playwright

- E2E tests live in `e2e/tests/` — never co-located with source code.
- **Local**: Start client + server, then `cd e2e && npx playwright test` (or `--headed` for visible browser).
- Name specs by page or flow: `<page>.spec.js` or `<flow>.spec.js`.
- Use Playwright's `page` fixture, not direct DOM manipulation.
- Tests must be **independent**: no shared state, no test ordering dependencies.
- Assert on visible text, roles, and user-facing behavior — not CSS classes or internal IDs.
- For admin tests, use Playwright's `storageState` to persist auth state.
- E2E tests are **not** blocking for commits. CI pipeline details are in `AGENTS.md`.

---

## 15. Development Workflow

### One Feature at a Time

1. **Branch**: Create a feature branch from `main` (`feature/<short-description>`).
2. **Implement**: Build the feature following all rules in this document.
3. **Test**: Write and run tests. All must pass.
4. **Review**: Self-review the diff. Check for rule violations.
5. **Merge**: Merge into `main` via pull request.
6. **Deploy**: Deploy from `main`.

### Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

Types: feat, fix, refactor, test, chore, docs, style
Scope: client, server, db, chat, auth, admin, linkedin
```

Examples:

- `feat(client): add landing page hero section`
- `fix(server): validate file type before Firestore upload`
- `test(server): add unit tests for contact service`

### Pre-Commit Checklist

Before every commit, verify:

- [ ] ESLint passes with zero warnings.
- [ ] Prettier formatting is applied.
- [ ] All tests pass.
- [ ] No `.env` files or secrets are staged.
- [ ] No files exceed the length limits.
- [ ] New code follows the layer responsibilities defined in Section 4.

---

## 16. Deployment (Vercel Monorepo)

Two Vercel projects from one repo: `ichnos-client` (Vite static) and `ichnos-protocol_server` (Express serverless via `@vercel/node`).

### Rules Claude must follow when writing code

- **`server/api/index.js` must stay thin**: only imports and re-exports the Express app. All setup in `server/src/app.js`.
- **Environment variables**: set in Vercel project settings, never committed. Client vars prefixed `VITE_`.
- **CORS**: `CORS_ORIGIN` must match the frontend URL.
- **Cold starts**: keep server dependencies lean for faster serverless startup.
- **Local dev uses `npm run dev`** — the Vercel wrapper is only for deployed environments.

CI/CD pipeline details (promotion, staging sync, E2E triggers) are in `AGENTS.md`.

---

## 17. Claude-Specific Instructions

### General Rules

When working on this project, Claude must:

1. **Read before writing.** Always read existing files before modifying them. Understand context first.
2. **One feature per session.** Focus on the single feature requested. Do not add unrequested features, refactors, or improvements.
3. **Follow the folder structure exactly.** Place files in the correct directory per Section 3. Ask if unsure.
4. **Respect layer boundaries.** Never put business logic in a controller. Never put DB queries in a service. Never put API calls in a component.
5. **Extract helpers aggressively.** If a block of logic can be named and reused, extract it into a helper function.
6. **Keep files short.** If a file approaches 120 lines, decompose it.
7. **Use existing patterns.** Before creating something new, check if a similar pattern already exists in the codebase and follow it.
8. **Write tests alongside code.** When building a new module, write its tests in the same session.
9. **Never hardcode secrets or URLs.** Use environment variables for all configuration.
10. **Provide the `.env.example` update** whenever a new environment variable is introduced.
11. **Use Bootstrap components and utility classes** for all styling. Do not write custom CSS unless Bootstrap cannot achieve the design.
12. **All API communication** goes through RTK Query. No raw fetch/axios in components.
13. **Validate inputs** at the boundary: Zod on the server, form validation on the client.
14. **When creating a new page**, wire up the route in the router, add it to the navigation if public, and protect it if admin-only.
15. **Run a mental test.** Before presenting code, mentally trace through the user flow to catch obvious issues.
16. **Use MCP integrations first.** Prefer GitHub MCP for repo operations, Neon MCP for database queries and schema inspection, Vercel MCP for deployment logs and env vars, Playwright MCP for E2E tests, and Context7 for library docs. See Section 18 for details.

### Traycer Plan Execution Rules

When receiving a plan from Traycer (via paste or CLI handoff), Claude must additionally:

16. **Read the entire plan before writing any code.** The plan is the authoritative specification for the current phase. Understand all steps, file references, and rationale before implementing.
17. **Trust file paths and symbol references in the plan.** Traycer has already analyzed the codebase. Do not redundantly re-verify the plan's statements about existing code structure unless something is clearly wrong at implementation time.
18. **Follow the plan's step order exactly.** Steps are sequenced deliberately — dependencies between file changes are already accounted for.
19. **Respect the 3-file-per-phase boundary.** Only modify the files specified in the current phase. If the plan references files outside its scope, note it but do not modify them.
20. **Do not modify files outside the plan's scope** unless strictly necessary for the plan's changes to compile/work (e.g., updating an import). Document any out-of-scope change.
21. **If the plan conflicts with CLAUDE.md conventions**, follow CLAUDE.md conventions (Sections 4–5) and note the conflict in the completion summary.
22. **After completing a phase, provide a summary**: files changed, what was done, any deviations from the plan, and any issues encountered. This enables Traycer verification.
23. **Commit changes per phase** using Conventional Commit format (Section 15). One commit per phase so Traycer can assess each independently.

### Permissions for Automated Execution

When Claude CLI is invoked by Traycer in automated/YOLO mode, the following actions are pre-authorized:

- Read any file in the repository
- Create and edit files within `client/src/` and `server/src/`
- Run `npm install`, `npm run lint`, `npm run format`, `npm test`, `npm run build`
- Run `npx` commands for tooling (migrations, code generation)
- Create git branches and commits
- Run the development server (`npm run dev`)

The following actions still require explicit user confirmation even in automated mode:

- `git push` to any remote
- Deleting files or directories
- Modifying files outside `client/` and `server/` (root config, CI/CD, CLAUDE.md itself)
- Running database migrations against production
- Installing new top-level dependencies (devDependencies are fine)

---

## 18. MCP Servers

MCP (Model Context Protocol) servers give Claude direct access to external
services. Use them instead of manual CLI commands or copy-pasting data.

### 18.1 Available Servers

| MCP Server | Scope | Transport | Auth | What it does |
|------------|-------|-----------|------|-------------|
| **GitHub** | Project | Remote | PAT | PRs, issues, commits, code search, file contents |
| **Neon** | User | Remote (`https://mcp.neon.tech/mcp`) | OAuth | PostgreSQL queries, schema, branches, migrations |
| **Vercel** | User | Remote (`https://mcp.vercel.com`) | OAuth | Deployment logs, env vars, project settings |
| **DBHub** | Project | Local stdio (`.mcp.json`) | Connection string | Direct SQL to Neon DB (legacy — prefer Neon MCP) |
| **Playwright** | Project | Local stdio (`.mcp.json`) | — | E2E test execution, browser automation, visual inspection |
| **Context7** | User | Remote | — | Library/framework documentation lookup |

**Scope**: "User" = configured in `~/.claude.json` (persists across projects). "Project" = configured in `.mcp.json` or `.claude/settings.json` (per-repo).

### 18.2 When to Use Which

| Task | Use this MCP |
|------|-------------|
| Debug a deployment failure | **Vercel** — check function logs, deployment status |
| Check environment variables on staging/production | **Vercel** — list/inspect env vars per project |
| Query production data to investigate a bug | **Neon** or **DBHub** — run SELECT queries |
| Verify DB tables/migrations exist | **Neon** — `execute_sql` or schema tools |
| Create/manage Neon database branches | **Neon** — branch management tools |
| Review a PR, check CI status, search code | **GitHub** — PR, issue, commit, code search tools |
| Look up library/framework API docs | **Context7** — documentation query |
| Run or debug E2E tests | **Playwright** — browser automation |

### 18.3 Neon MCP (Database)

**Endpoint**: `https://mcp.neon.tech/mcp`
**Auth**: OAuth (browser popup on first use)
**Setup**: `claude mcp add --transport http --scope user neon https://mcp.neon.tech/mcp`

Provides ~20 tools covering the full database lifecycle: query execution, schema inspection, branch management, migrations, connection strings, and documentation.

**Important rules**:
- **Read-first by default.** Prefer SELECT queries for investigation. Only run mutating queries when explicitly asked.
- **This connects to the production database.** Confirm with the user before destructive queries (DELETE, DROP, TRUNCATE).

### 18.4 Vercel MCP (Deployments)

**Endpoint**: `https://mcp.vercel.com`
**Auth**: OAuth (browser popup on first use)
**Setup**: `claude mcp add --transport http --scope user vercel https://mcp.vercel.com`

For project-specific context (auto-fills team/project params), use:
`https://mcp.vercel.com/<teamSlug>/<projectSlug>`

**Key tools**: search docs, list/inspect deployments, view function logs, manage env vars, check project settings.

### 18.5 Playwright MCP (Browser Automation)

**Transport**: Local stdio via `.mcp.json`
**Package**: `@playwright/mcp@latest`
**Setup**: Already configured in `.mcp.json`. Uses `cmd /c npx -y @playwright/mcp@latest` on Windows.

Provides browser automation tools for E2E testing and visual inspection: navigate, click, fill forms, take screenshots, read console messages, inspect network requests, and capture accessibility snapshots.

**Key tools**: `browser_navigate`, `browser_click`, `browser_fill_form`, `browser_snapshot`, `browser_take_screenshot`, `browser_console_messages`, `browser_network_requests`, `browser_evaluate`.

**Important rules**:
- **Use `browser_snapshot` over screenshots** for element inspection — it returns an accessibility tree that is more reliable for identifying interactive elements.
- **Close the browser** (`browser_close`) when done to free resources.
- **E2E tests in `e2e/`** are the primary testing mechanism. Use the Playwright MCP for ad-hoc debugging, visual verification, and interactive investigation — not as a replacement for the test suite.
- **Prefer Playwright test runner** (`npx playwright test`) for running the full suite. Use MCP tools for targeted page inspection or reproducing specific issues.

### 18.6 DBHub (Legacy Database Access)

Local MCP server in `.mcp.json` (gitignored). Prefer Neon MCP (§18.3) for new work. DBHub is a fallback when Neon MCP is unavailable. Setup: copy `DATABASE_URL` from `server/.env` into `.mcp.json` as the `DSN` env var.
