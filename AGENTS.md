# AGENTS.md — Ichnos Protocol

## Project

Company website for Ichnos Protocol, showcasing the Battery Passport solution.
Monorepo: `client/` (React frontend) + `server/` (Express backend).

## Tech stack

| Layer        | Technology                     |
|--------------|--------------------------------|
| Frontend     | React 18+, Bootstrap 5, Redux Toolkit (RTK Query), React Router v6+ |
| Backend      | Express.js, REST API           |
| SQL DB       | PostgreSQL (Neon Tech)         |
| NoSQL/Files  | Firebase Firestore + Storage   |
| Auth         | Firebase Authentication        |
| Chatbot      | X.ai Grok API (RAG)           |
| LinkedIn     | Third-party embed widget       |
| Testing      | Vitest, React Testing Library, Supertest |
| Linting      | ESLint + Prettier              |

## Repository structure

```
client/src/
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

server/src/
  config/            # DB, Firebase admin, env
  controllers/       # Thin route handlers
  services/          # Business logic
  repositories/      # Data access (SQL, Firestore)
  middleware/        # Auth, errors, validation
  routes/            # Express routers
  helpers/           # Pure utilities
  validators/        # Request schemas (Zod / Joi)
```

## Build & test commands

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
npm run build            # production build
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
- Named exports only (exception: lazy-loaded page components).
- Functional components only. Props destructured in signature.
- One component per file. File name matches component name.
- No inline styles. Use Bootstrap utility classes.
- All API calls through RTK Query. No raw fetch/axios in components.
- Extract helpers for any logic block > 3 lines. Helpers must be pure functions.

## Testing

- Co-locate tests: `Module.test.jsx` next to `Module.jsx`.
- Unit tests: all helpers, services, repositories.
- Component tests: React Testing Library — test interactions, not internals.
- API tests: Supertest for endpoints.
- Coverage target: 80% for helpers and services.

## Git conventions

- Conventional Commits: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `style`
- Scopes: `client`, `server`, `db`, `chat`, `auth`, `admin`, `linkedin`
- Branch per feature: `feature/<short-description>` from `main`

## Security essentials

- Parameterized SQL queries only. Never interpolate user input.
- Validate all inputs server-side (Zod / Joi).
- Firebase ID tokens verified server-side on every protected request.
- Never use `dangerouslySetInnerHTML`.
- CORS restricted to frontend origin only.
- Rate limiting on public endpoints.
- File uploads: validate type + size (max 10MB, PDF/DOCX/PNG/JPG only).
- Never commit `.env` files or secrets.

## Development workflow

- One feature at a time. Branch, implement, test, review, merge, deploy.
- Each Traycer phase scoped to max 3 files.
- All tests must pass before commit.
- ESLint zero warnings, Prettier applied before commit.
