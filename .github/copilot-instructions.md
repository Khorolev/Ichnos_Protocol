# GitHub Copilot Instructions

Use these repository-wide instructions for Ichnos Protocol. `AGENTS.md` is the shared source of truth for project conventions, and `CLAUDE.md` contains additional agent-specific detail.

## Project overview

- Monorepo with `client/` (React 18 + Vite + Bootstrap + Redux Toolkit/RTK Query) and `server/` (Express 5 + REST API + PostgreSQL + Firebase).
- The site includes public marketing pages, a Grok-powered chatbot, document uploads, and an admin dashboard for customer requests.
- Deployment target is Vercel: `client/` as a Vite static app and `server/` as a serverless Express app.

## Architecture rules

- Follow Atomic Design on the frontend: pages → templates → organisms → molecules → atoms.
- Keep route components thin. No business logic or direct API calls in pages.
- Use hooks, slices, and RTK Query for frontend state and data access. Do not use raw `fetch` or `axios` in React components.
- Follow backend layering strictly: routes → controllers → services → repositories.
- Controllers stay thin, services hold business logic, repositories own all SQL/Firestore access.

## Coding conventions

- Use JavaScript ES2022+. Do not introduce TypeScript unless explicitly requested.
- Prefer functional React components with destructured props and default exports for components.
- Use named exports for utilities, hooks, constants, Redux slices, and infrastructure files.
- Keep files and functions small; extract pure helpers for logic blocks longer than a few lines.
- Use Bootstrap utility classes and `react-bootstrap` components instead of inline styles or custom UI frameworks.
- Component names use `PascalCase`, hooks use `useCamelCase`, helpers use `camelCase`, constants use `UPPER_SNAKE_CASE`, DB columns use `snake_case`, and API endpoints use `kebab-case`.

## Testing and validation

- Use existing project scripts only:
  - `cd client && npm run lint && npm test -- --run && npm run build`
  - `cd server && npm test -- --run`
- Co-locate Vitest tests with the modules they cover.
- Prefer focused tests for changed behavior and avoid unrelated test churn.

## Security and data handling

- Never commit secrets or `.env` files.
- Validate server inputs with Zod.
- Use parameterized SQL queries only.
- Verify Firebase ID tokens server-side for protected routes.
- Never use `dangerouslySetInnerHTML`.
- Restrict file uploads to the documented allowed types and size limits.

## Workflow preferences

- Make the smallest possible change that fully solves the task.
- Follow existing patterns before introducing new abstractions.
- Update documentation when it is directly related to the change.
- If conventions appear to conflict, prefer `AGENTS.md` for shared repository rules and keep changes aligned with `CLAUDE.md`.
