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

### End-to-End Tests (Playwright)

- E2E tests live in `e2e/tests/` at the repository root (separate from client/server).
- **Local**: Start client + server locally, run `cd e2e && npx playwright test`.
- **CI**: Playwright runs against Vercel preview deployment URLs via GitHub Actions.
- Browsers: Chromium, Firefox, WebKit in CI; Chromium-only locally.
- E2E tests run on PRs only — not blocking for commits.

## Git conventions

- Conventional Commits: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `style`
- Scopes: `client`, `server`, `db`, `chat`, `auth`, `admin`, `linkedin`
- Branch per feature: `feature/<short-description>` from `main`

## Security essentials

- Parameterized SQL queries only. Never interpolate user input.
- Validate all inputs server-side (Zod).
- Firebase ID tokens verified server-side on every protected request.
- Never use `dangerouslySetInnerHTML`.
- CORS restricted to frontend origin only.
- Rate limiting on public endpoints.
- File uploads: validate type + size (max 10MB, PDF/DOCX/PNG/JPG only).
- Never commit `.env` files or secrets.

## Deployment (Vercel Monorepo)

- Deployed on **Vercel** as two projects from the same repo.
- **Frontend** (`client/`): Vite static build → `dist/`. SPA rewrites to `index.html`.
- **Backend** (`server/`): Express app wrapped as a Vercel serverless function via `server/api/index.js` using `@vercel/node`.
- Merges to `main` trigger automatic production deployments.
- PRs get automatic preview deployments.
- Environment variables set in Vercel project settings, never committed.
- `server/api/index.js` only re-exports the Express app. All setup stays in `server/src/app.js`.

## Development workflow

- One feature at a time. Branch, implement, test, review, merge, deploy.
- Each Traycer phase scoped to max 3 files.
- All tests must pass before commit.
- ESLint zero warnings, Prettier applied before commit.
