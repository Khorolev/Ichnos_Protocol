@AGENTS.md

# CLAUDE.md — Ichnos Protocol Website

> This file contains Claude-specific rules and detailed project context.
> Shared, tool-agnostic conventions are in `AGENTS.md` (auto-imported above).
> Both files must stay aligned — update `AGENTS.md` when conventions change here.

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

| Layer        | Technology                     | Notes                                        |
| ------------ | ------------------------------ | -------------------------------------------- |
| Frontend     | React 18+                      | Functional components, hooks only            |
| Build Tool   | Vite                           | Dev server, HMR, production bundling         |
| UI Framework | Bootstrap 5 (react-bootstrap)  | No custom CSS frameworks on top              |
| State        | Redux Toolkit (RTK)            | RTK Query for API calls                      |
| Routing      | React Router v6+               |                                              |
| Backend      | Express.js 5                   | REST API, ES modules (`"type": "module"`)    |
| SQL DB       | PostgreSQL (Neon Tech)         | Accessed via `pg`                            |
| NoSQL DB     | Firestore                      | File storage + document metadata             |
| Auth         | Firebase Authentication        | JWT-based, verified server-side              |
| Chatbot      | X.ai Grok API                  | RAG integration                              |
| LinkedIn     | Third-party embed widget       | SociableKIT, Elfsight, or Juicer             |
| Testing      | Vitest + React Testing Library | Unit + component tests; Supertest for API    |
| E2E Testing  | Playwright                     | End-to-end tests against Vercel previews     |
| Linting      | ESLint + Prettier              | Enforced via pre-commit hook                 |
| Deployment   | Vercel (Monorepo)              | `client/` and `server/` as separate projects |

---

## 3. Repository Structure

This is a **monorepo** with two top-level packages:

```
Ichnos_Protocol/
├── client/                       # React frontend
│   ├── public/
│   ├── src/
│   │   ├── app/                  # Store configuration, root providers
│   │   │   ├── store.js
│   │   │   └── rootReducer.js
│   │   ├── components/           # Atomic Design hierarchy
│   │   │   ├── atoms/            # Buttons, inputs, labels, icons
│   │   │   ├── molecules/        # Form groups, card headers, nav items
│   │   │   ├── organisms/        # Navbar, footer, chatbot widget, forms
│   │   │   ├── templates/        # Page layouts (public, admin)
│   │   │   └── pages/            # Route-level components (thin wrappers)
│   │   ├── features/             # Redux slices + RTK Query APIs
│   │   │   ├── auth/
│   │   │   ├── chat/
│   │   │   ├── linkedin/
│   │   │   ├── requests/
│   │   │   └── services/
│   │   ├── hooks/                # Custom reusable hooks
│   │   ├── helpers/              # Pure utility/helper functions
│   │   ├── constants/            # App-wide constants and config
│   │   ├── routes/               # Route definitions and guards
│   │   └── index.jsx             # Entry point
│   ├── .env.example
│   ├── vercel.json               # Vercel frontend config (Vite, SPA rewrites)
│   ├── vite.config.js
│   └── package.json
├── server/                       # Express backend
│   ├── api/
│   │   └── index.js              # Vercel serverless entry point (wraps Express)
│   ├── src/
│   │   ├── config/               # DB connections, Firebase admin init, env
│   │   ├── controllers/          # Route handlers (thin — delegate to services)
│   │   ├── services/             # Business logic
│   │   ├── repositories/         # Data access (SQL queries, Firestore ops)
│   │   ├── middleware/           # Auth verification, error handler, validation
│   │   ├── routes/               # Express router definitions
│   │   ├── helpers/              # Pure utility functions
│   │   ├── validators/           # Request validation schemas (Zod)
│   │   └── app.js                # Express app setup
│   ├── .env.example
│   ├── vercel.json               # Vercel backend config (serverless, rewrites)
│   └── package.json
├── e2e/                          # End-to-end tests (Playwright)
│   ├── tests/                    # Test specs
│   ├── fixtures/                 # Test data and auth state
│   ├── playwright.config.js      # Playwright configuration
│   └── package.json              # Playwright dependencies
├── .github/
│   └── workflows/
│       ├── ci.yml                        # Lint + unit tests on every PR
│       ├── e2e.yml                       # Playwright E2E — repository_dispatch (staging URL) + workflow_dispatch
│       ├── promote-to-production.yml     # Approval-gated production promotion on push to release
│       └── release-policy-check.yml     # Enforces release branch policy
├── assets/                       # Brand assets (logo, images)
├── CLAUDE.md                     # This file
├── AGENTS.md                     # Shared agent conventions
├── .gitignore
└── README.md
```

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

### Background

LinkedIn's official Posts API (Community Management API) requires OAuth 2.0 approval, a verified company page, and a review process geared toward marketing platforms — not small company websites. The approval is opaque and non-trivial. Native RSS feeds for company posts do not exist. Scraping violates LinkedIn's Terms of Service.

### Recommended Approach: Third-Party Embed Widget

Use a third-party widget service that handles the LinkedIn integration and provides an auto-updating embeddable feed. Recommended options (in priority order):

| Service         | Free Tier              | Paid From | Notes                                 |
| --------------- | ---------------------- | --------- | ------------------------------------- |
| **SociableKIT** | 2 sources, 3K views/mo | ~$5/mo    | LinkedIn Page Posts widget; auto-sync |
| **Elfsight**    | Limited                | ~$6/mo    | Drag-and-drop builder; many layouts   |
| **Juicer**      | 1 widget, 200 views/mo | $5/mo     | Multi-platform aggregator; clean UI   |

### Implementation Rules

- The LinkedIn feed is an **organism** component: `LinkedInFeed.jsx` in `components/organisms/`.
- Embed the widget via a dedicated wrapper component. Do **not** paste raw `<script>` tags directly into JSX.
- Load the third-party script **lazily** (dynamic import or `useEffect` with script injection) to avoid blocking page load.
- The widget configuration (container ID, data source URL) lives in `constants/` or environment variables, not hardcoded in the component.
- If the widget fails to load, render a **graceful fallback**: a "Follow us on LinkedIn" link/button pointing to the company page.
- Feature directory: `features/linkedin/` — holds any slice logic if needed (e.g., tracking load state).

### Fallback: Manual Embeds

If the third-party service becomes unavailable, LinkedIn allows embedding individual posts via `<iframe>`. This is manual (one embed per post) and does not auto-update, but serves as a zero-dependency fallback.

### Future: Direct API Integration

If the company later obtains Community Management API access, the implementation can be upgraded:

- Backend caches posts via a cron job (`GET /api/linkedin/posts`), stored in PostgreSQL or in-memory cache.
- Frontend fetches from the backend cache via RTK Query.
- The `LinkedInFeed` organism switches from widget embed to rendering cached post data with custom styling.
- This change should be isolated to the `linkedin` feature and the `LinkedInFeed` organism — no other components should need modification.

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

All secrets and configuration live in `.env` files. **Never commit `.env` files.**

### Client (`client/.env`)

```
VITE_API_BASE_URL=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_LINKEDIN_WIDGET_ID=             # Third-party widget embed ID (SociableKIT / Elfsight)
VITE_LINKEDIN_PAGE_URL=              # Company LinkedIn page URL (fallback link)
```

### Server (`server/.env`)

```
PORT=
DATABASE_URL=                    # Neon Tech PostgreSQL connection string
FIREBASE_SERVICE_ACCOUNT_KEY=    # Path to service account JSON or JSON string
XAI_API_KEY=                     # X.ai Grok API key
XAI_API_BASE_URL=
CORS_ORIGIN=                     # Frontend URL
```

### GitHub Actions Variables (visible, not masked)

Configured in **GitHub → Settings → Secrets and variables → Actions → Variables tab**. These are non-sensitive values that should be visible in logs for debugging.

```
E2E_BASE_URL=                        # Stable staging client URL (e.g. https://staging-client.ichnos-protocol.com)
E2E_API_BASE_URL=                    # Stable staging API URL (e.g. https://staging-api.ichnos-protocol.com)
```

### GitHub Actions Secrets (masked, write-only)

Configured in **GitHub → Settings → Secrets and variables → Actions → Secrets tab**. These are sensitive values that are masked in logs.

```
E2E_ADMIN_EMAIL=                     # Firebase admin test user email
E2E_ADMIN_PASSWORD=                  # Firebase admin test user password
E2E_USER_EMAIL=                      # Firebase regular test user email
E2E_USER_PASSWORD=                   # Firebase regular test user password
E2E_SUPER_ADMIN_EMAIL=               # Firebase super admin test user email
E2E_SUPER_ADMIN_PASSWORD=            # Firebase super admin test user password
FIREBASE_API_KEY=                    # Firebase API key (client-side, for E2E auth)
VERCEL_AUTOMATION_BYPASS_SECRET=     # Vercel Deployment Protection bypass secret (from Vercel → Settings → Deployment Protection → Protection Bypass for Automation)
```

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
      expect.objectContaining({ message: "fail" })
    );
    // For async functions:
    await expect(() => fn()).rejects.toThrowError(
      expect.objectContaining({ message: "fail" })
    );
    ```

### 14.4 End-to-End Testing: Playwright

Playwright runs full browser-based tests against the actual deployed application.

#### Directory Structure

```
e2e/
├── tests/                    # Test specs
│   ├── landing.spec.js       # Landing page flows
│   ├── services.spec.js      # Services page flows
│   ├── team.spec.js          # Team page flows
│   ├── chatbot.spec.js       # Chatbot interaction flows
│   └── admin.spec.js         # Admin dashboard flows (authenticated)
├── fixtures/                 # Test data and auth state
├── playwright.config.js      # Playwright configuration
└── package.json              # Playwright dependencies (separate from client/server)
```

#### Configuration

- **Config file**: `e2e/playwright.config.js`.
- **Base URL**: Read from `BASE_URL` environment variable. Defaults to `http://localhost:5173` for local dev.
- **Browsers**: Chromium, Firefox, WebKit (all three for CI; Chromium-only for local speed).
- **Retries**: 0 locally, 2 in CI.
- **Timeouts**: 30s per test, 5s per action.

#### Local Development Workflow

Run both client and server locally, then execute Playwright:

```bash
# Terminal 1: Start backend
cd server && npm run dev

# Terminal 2: Start frontend
cd client && npm run dev

# Terminal 3: Run E2E tests against localhost
cd e2e && npx playwright test

# Run a single test file
cd e2e && npx playwright test tests/landing.spec.js

# Run in headed mode (visible browser)
cd e2e && npx playwright test --headed

# Open the HTML report
cd e2e && npx playwright show-report
```

#### CI Workflow: Playwright Against Vercel Preview Deployments

E2E tests run in a **separate workflow** (`e2e.yml`), not inside the CI workflow (`ci.yml`). This avoids wasting runner time polling for Vercel deployments.

**Primary trigger**: `repository_dispatch` (`vercel.deployment.success`) — Vercel emits this event after each successful preview deployment when Repository Dispatch Events are enabled in the Vercel **client** project's Git settings. The workflow filters out server deployments via `project.name`. Tests run against the stable staging domains configured via GitHub Actions secrets (`E2E_BASE_URL` for the client, `E2E_API_BASE_URL` for the API), not the per-deployment hash URLs (which can become stale if Vercel cancels/supersedes a deployment). Vercel Deployment Protection is bypassed using the `VERCEL_AUTOMATION_BYPASS_SECRET` secret. Chromium only. One concurrent run per project — newer deployments cancel in-progress runs.

**Secondary trigger**: `workflow_dispatch` — manual/ad-hoc runs against any `base_url` input; full browser suite available.

**Commit status**: The workflow posts a commit status (`E2E Tests (Playwright)`) to the PR so results are visible alongside CI checks, even though E2E runs in a separate workflow.

#### E2E Test Rules

- E2E tests live in `e2e/tests/` — never co-located with source code.
- Name specs by page or user flow: `<page>.spec.js` or `<flow>.spec.js`.
- Use Playwright's `page` fixture, not direct DOM manipulation.
- Tests must be **independent**: no shared state, no test ordering dependencies.
- Use `test.describe` to group related tests. Use `test.beforeEach` for common setup (e.g., navigation).
- For admin tests requiring authentication, use Playwright's `storageState` to persist and reuse auth state across tests.
- Do not assert on CSS class names or internal IDs. Assert on visible text, roles, and user-facing behavior.
- E2E tests are **not** blocking for commits. They run in CI on pull requests only.

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

This project is deployed on **Vercel** as a monorepo with two separate Vercel projects linked to the same Git repository.

### Architecture

```
GitHub Repository (Ichnos_Protocol)
    │
    ├── Vercel Project: ichnos-client
    │   ├── Root Directory: client/
    │   ├── Framework: Vite
    │   └── Output: Static site (dist/)
    │
    └── Vercel Project: ichnos-server
        ├── Root Directory: server/
        ├── Runtime: @vercel/node
        └── Entry: api/index.js (wraps Express app)
```

### Frontend (`client/`)

- **Framework preset**: Vite.
- **Build command**: `npm run build` (outputs to `dist/`).
- **SPA routing**: All routes rewrite to `/index.html` via `vercel.json`.
- **Environment variables**: Set in Vercel project settings (never committed). Prefix with `VITE_`.

### Backend (`server/`)

- **Serverless functions**: Express app is wrapped and exported from `server/api/index.js` as a Vercel serverless function using `@vercel/node`.
- **Rewrites**: All incoming requests route to the single serverless function, which uses Express routing internally.
- **Environment variables**: Set in Vercel project settings (`DATABASE_URL`, `FIREBASE_SERVICE_ACCOUNT_KEY`, `XAI_API_KEY`, etc.).
- **Cold starts**: Be aware of serverless cold start latency. Keep dependencies lean.

### Vercel Configuration Files

| File                  | Purpose                                                       |
| --------------------- | ------------------------------------------------------------- |
| `client/vercel.json`  | Vite framework, build output, SPA rewrites                    |
| `server/vercel.json`  | Serverless build config, `@vercel/node` runtime, API rewrites |
| `server/api/index.js` | Thin wrapper exporting the Express app for Vercel serverless  |

### Deployment Rules

- **Preview deployments**: Vercel's native Git integration creates preview deployments automatically on every branch push and PR — no GitHub Actions workflow is involved in creating previews. Merges to `main` produce a validated preview, not a production deploy.
- **Production promotion**: Triggered automatically on push/merge to `release` via `promote-to-production.yml`. The workflow pauses for human approval via the GitHub `production` environment before promoting the latest validated `main` preview to production — no rebuild occurs.
- **Environment separation**: Use Vercel's environment scoping (Production, Preview, Development) to manage secrets per environment.
- **CORS**: The server's `CORS_ORIGIN` must match the frontend's Vercel deployment URL (or use the `VERCEL_URL` environment variable for preview deployments).
- **Domain**: Configure custom domains in Vercel project settings, not in code.
- **`server/api/index.js` must stay thin**: It only imports and re-exports the Express app. No logic, no middleware, no configuration. All Express setup lives in `server/src/app.js`.
- **Local development still uses `npm run dev`**: The Vercel serverless wrapper is only used in deployed environments.

### Vercel CLI (Optional, for Manual Deploys)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend preview
cd client && vercel

# Deploy backend preview
cd server && vercel

# Deploy to production
cd client && vercel --prod
cd server && vercel --prod
```

---

## 17. Traycer AI Integration

This project uses **Traycer AI** as the planning and orchestration layer. Traycer handles Epics, Phase breakdowns, and detailed implementation plans. **Claude CLI executes the plans.**

### Workflow Overview

```
User Intent
    │
    ▼
[Traycer: Epic Definition] ─── High-level feature description
    │
    ▼
[Traycer: Phase Breakdown] ─── Ordered phases, each scoped to ≤ 3 files
    │
    ▼
[Traycer: Phase Planning] ─── File-level implementation plan (Markdown)
    │                          with symbol refs, step sequence, rationale
    ▼
[Claude CLI: Execution] ─── Implements the plan for the current phase
    │
    ▼
[Traycer: Verification] ─── Compares output to plan, flags issues
    │                         (Critical / Major / Minor / Outdated)
    ▼
[Fix / Next Phase] ─── Iterate or advance
```

### Phase Constraints

- Each phase is scoped to a **maximum of 3 files**. This keeps context tight and changes reviewable.
- Phases are **sequential** — complete one fully before starting the next.
- Each phase should result in a **working, testable increment** (no half-implemented features spanning phases).

### Plan Format

Traycer produces **Markdown plans** containing:

- File analysis and codebase structure context
- Symbol references (specific classes, functions, variables)
- Sequential implementation steps with file-by-file instructions
- Rationale for each change
- Mermaid diagrams (when architectural clarity is needed)

Plans arrive via:

- **Clipboard paste** into Claude CLI prompt
- **CLI handoff**: `claude "$TRAYCER_PROMPT"` or via `$TRAYCER_PROMPT_TMP_FILE` for large plans
- **YOLO mode**: `claude --dangerously-skip-permissions "$TRAYCER_PROMPT"` (auto-approve all tool calls)

### Environment Variables (set by Traycer during handoff)

| Variable                      | Purpose                                 |
| ----------------------------- | --------------------------------------- |
| `$TRAYCER_PROMPT`             | The plan/instructions text              |
| `$TRAYCER_PROMPT_TMP_FILE`    | Path to temp file with the plan (large) |
| `$TRAYCER_PHASE_ID`           | Current phase identifier                |
| `$TRAYCER_PHASE_BREAKDOWN_ID` | Phase list persistence identifier       |
| `$TRAYCER_TASK_ID`            | Full task iteration tracker             |

---

## 18. Claude-Specific Instructions

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
