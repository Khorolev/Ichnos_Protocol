# Ichnos Protocol

> Tracing the lifecycle of every battery — from first charge to second life.

**Ichnos Protocol Pte. Ltd.** builds the next-generation Battery Passport: a solution that goes beyond DIN SPEC 99100 compliance to deliver real utility for manufacturers, repurposers, remanufacturers, and SMEs seeking creative second-life applications for used batteries.

![Ichnos Protocol Logo](assets/Ichnos_Logo_832x832.png)

---

## Table of Contents

- [About the Company](#about-the-company)
- [The Founder](#the-founder)
- [The Battery Passport](#the-battery-passport)
- [Services](#services)
- [Website Pages](#website-pages)
- [Design System](#design-system)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Claude Code MCP Servers](#claude-code-mcp-servers)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Development Workflow](#development-workflow)
- [Legal](#legal)

---

## About the Company

**Ichnos Protocol Pte. Ltd.** is registered in Singapore.

| Detail              | Value                                                        |
|---------------------|--------------------------------------------------------------|
| Legal Name          | Ichnos Protocol Pte. Ltd.                                    |
| UEN                 | 202606521W                                                   |
| Registered Address  | 160 Robinson Road, #14-04 Singapore Business Federation Center, Singapore 068914 |
| Jurisdiction        | Singapore                                                    |

### Why Singapore?

Singapore provides strategic advantages for Ichnos Protocol's mission:

- **ASEAN market access** — Direct gateway to Southeast Asia's rapidly growing battery and EV markets.
- **EU trade alignment** — Singapore's comprehensive free trade agreement with the EU simplifies cross-border services, compliance consulting, and data flows.
- **Regulatory credibility** — A transparent, business-friendly regulatory environment that international clients and partners trust.
- **Accounting efficiency** — Streamlined corporate compliance and accounting frameworks reduce operational overhead.

---

## The Founder

**Dr.-Ing. Francesco Maltoni** founded Ichnos Protocol after a career spanning research and industry leadership in the battery and automotive sectors.

### Background

| Area                      | Detail                                                                 |
|---------------------------|------------------------------------------------------------------------|
| Academic Research         | RWTH Aachen University — circular economy for battery systems, with a focus on remanufacturing |
| Industry Experience       | Lead Expert, Battery Systems at FEV Europe                             |
| Domain Expertise          | Battery system development, requirement management, legal and homologation requirements, EU Battery Regulation |
| Software Engineering      | Full Stack Web Developer — trained at Sigma School, Puchong            |
| Industry Background       | Motorcycle and automotive industries                                   |

### Vision

Dr.-Ing. Maltoni's work is driven by a core conviction: **batteries should live as long as possible**. Remanufacturing and repurposing are not just environmentally responsible — they are economically smart. The Battery Passport is the enabler, providing the transparency and data continuity that make second-life applications viable and scalable.

By combining deep domain expertise in battery engineering with hands-on software development skills, Dr.-Ing. Maltoni is uniquely positioned to build a Battery Passport solution that serves both regulatory compliance and real-world utility.

---

## The Battery Passport

### The Regulatory Context

The **EU Battery Regulation** mandates that batteries placed on the European market carry a digital passport — a structured dataset covering composition, performance, durability, and end-of-life handling. The **DIN SPEC 99100** standard provides a technical framework for implementing this passport.

### Beyond Compliance

Most Battery Passport solutions stop at the minimum required dataset. Ichnos Protocol goes further:

| Capability                          | Mandated | Ichnos Protocol |
|-------------------------------------|----------|-----------------|
| Composition and materials data      | Yes      | Yes             |
| Performance and durability metrics  | Yes      | Yes             |
| Carbon footprint declaration        | Yes      | Yes             |
| Supply chain due diligence          | Yes      | Yes             |
| **Remanufacturing readiness score** | No       | Yes             |
| **Second-life application matching**| No       | Yes             |
| **SME marketplace integration**     | No       | Yes             |
| **Degradation forecasting**         | No       | Yes             |
| **Repurposer/remanufacturer tools** | No       | Yes             |

### Technology Roadmap

The Battery Passport follows a staged technical architecture:

1. **Prototype Phase** (current) — SQL (PostgreSQL) and NoSQL (Firestore) databases for rapid iteration and validation of the data model.
2. **Production Phase** — Migration to **Solana blockchain** for immutable, decentralized battery lifecycle records with transparent provenance and interoperability.

The Solana choice aligns with the project's values: high throughput, low cost, and a growing ecosystem of sustainability-focused decentralized applications.

---

## Services

Ichnos Protocol offers consulting and development services for companies navigating the battery regulation landscape.

### Consulting Services

| Service                                      | Description                                                                                              |
|----------------------------------------------|----------------------------------------------------------------------------------------------------------|
| **Battery Regulation Compliance**            | Gap analysis, compliance roadmap, and documentation preparation for the EU Battery Regulation.           |
| **Homologation Support**                     | End-to-end support for type approval processes, including coordination with notified bodies in the EU.    |
| **Testing Center Coordination**              | Selection of and liaison with accredited testing centers for battery safety, performance, and durability. |
| **Requirement Management**                   | Structuring and managing technical, legal, and regulatory requirements for battery system development.    |
| **Battery Passport Development (In-House)**  | Help your engineering team build a Battery Passport solution tailored to your products and processes.     |
| **Circular Economy Strategy**                | Advisory on remanufacturing, repurposing, and second-life strategies to maximize battery asset value.     |

### Competitive Advantage

- **Rates** — Competitive pricing compared to large consultancies, with direct access to senior expertise.
- **Depth** — Rare combination of hands-on battery engineering, regulatory knowledge, and software development capability.
- **Pragmatism** — Solutions designed for implementation, not just documentation.

---

## Website Pages

The website is structured to serve two audiences: **potential clients** seeking battery compliance and consulting services, and **technology partners** interested in the Battery Passport platform.

### Public Pages

#### Landing Page (`/`)

The first impression. Communicates who Ichnos Protocol is, what problem it solves, and why a visitor should engage further.

| Section              | Content                                                                                         |
|----------------------|-------------------------------------------------------------------------------------------------|
| **Hero**             | Tagline, one-sentence value proposition, primary CTA ("Get in Touch" / "Explore Services").     |
| **Problem Statement**| The EU Battery Regulation challenge — what companies face and what's at stake.                  |
| **Solution Overview**| The Ichnos Battery Passport — compliance plus real utility, in a brief visual summary.          |
| **Why Ichnos**       | Three to four differentiators: domain depth, beyond-compliance features, competitive rates, ASEAN+EU reach. |
| **Services Snapshot**| Card grid previewing key services, linking to the full Services page.                           |
| **LinkedIn Feed**    | Latest company posts via embedded widget — signals activity and thought leadership.             |
| **CTA / Contact**    | Closing call to action — directs to the chatbot contact flow or a contact form.                 |

#### Team Page (`/team`)

Builds trust through transparency. Shows who is behind the company.

| Section                | Content                                                                                     |
|------------------------|---------------------------------------------------------------------------------------------|
| **Founder Profile**    | Photo, name, title, bio summarizing academic and industry background (see [The Founder](#the-founder)). |
| **Expertise Areas**    | Visual representation of core competencies (battery systems, regulation, software).          |
| **Career Highlights**  | Key milestones: RWTH Aachen research, FEV Europe role, Sigma School, company founding.       |
| **Vision Statement**   | The circular economy mission and what drives the company.                                    |

> As the team grows, this page will expand to include additional team members with consistent card-based profiles.

#### Services Page (`/services`)

The commercial core. Details what Ichnos Protocol offers and showcases the Battery Passport product.

| Section                          | Content                                                                              |
|----------------------------------|--------------------------------------------------------------------------------------|
| **Services Overview**            | Introduction to the consulting and development offerings.                            |
| **Service Cards**                | One card per service (see [Services](#services)) with description and CTA.           |
| **Battery Passport Showcase**    | Dedicated section explaining the product: features, compliance scope, technology roadmap, and differentiators. |
| **How It Works**                 | Step-by-step visual flow: data collection, passport creation, lifecycle tracking, second-life enablement. |
| **Target Industries**            | Automotive, motorcycle, energy storage, industrial equipment, marine.                |
| **CTA**                          | "Discuss Your Needs" — triggers chatbot contact flow or links to contact.            |

### Admin Pages

#### Admin Dashboard (`/admin/requests`)

Internal tool for managing inbound customer inquiries.

| Feature                  | Description                                                        |
|--------------------------|--------------------------------------------------------------------|
| **Request Table**        | Name, email, company, message preview, status, date, document link.|
| **Status Management**    | Update status: `new` → `in_progress` → `resolved`.                |
| **Document Access**      | View/download uploaded files from Firestore.                       |
| **Filtering & Search**   | Filter by status, date range, or keyword.                          |

### Chatbot (All Public Pages)

A persistent AI-powered assistant available on every public page.

| Capability              | Description                                                                  |
|-------------------------|------------------------------------------------------------------------------|
| **Company Q&A**         | Answers questions about Ichnos Protocol, services, pricing, and expertise.   |
| **Contact Flow**        | Collects name, email, company, message — creates a customer request.         |
| **Document Upload**     | Accepts file uploads (PDF, DOCX, PNG, JPG, max 10MB) as part of inquiries.  |
| **RAG-Powered**         | Responses grounded in a curated knowledge base about the company.            |

---

## Design System

### Color Palette

The color palette is derived from the **company logo** (a tree with circuit-board roots against a deep navy background with luminous blue highlights and golden accents) and aligned with the **Solana ecosystem** aesthetic.

| Role              | Color                  | Hex       | Usage                                          |
|-------------------|------------------------|-----------|-------------------------------------------------|
| **Primary Dark**  | Deep Navy              | `#0A1628` | Backgrounds, hero sections, footer              |
| **Primary**       | Luminous Blue          | `#1E90FF` | Links, buttons, interactive elements             |
| **Accent**        | Cyan / Teal            | `#00D1C1` | Highlights, hover states, secondary CTAs         |
| **Accent Warm**   | Golden Amber           | `#C8A24E` | Accents, badges, premium indicators              |
| **Gradient Start**| Solana Teal            | `#14F195` | Gradient accents (Solana alignment)              |
| **Gradient End**  | Solana Purple          | `#9945FF` | Gradient accents (Solana alignment)              |
| **Surface**       | Slate Blue             | `#1A2744` | Cards, panels, elevated surfaces                 |
| **Text Primary**  | Off-White              | `#E8ECF1` | Body text on dark backgrounds                    |
| **Text Secondary**| Muted Blue-Gray        | `#8B9DC3` | Secondary text, captions, metadata               |
| **Background Alt**| Light Gray             | `#F5F7FA` | Light-mode sections, alternating content blocks   |
| **Text Dark**     | Charcoal               | `#1A1A2E` | Body text on light backgrounds                   |

### Typography

- **Headings**: Clean sans-serif (Inter, Plus Jakarta Sans, or system sans-serif stack).
- **Body**: Readable sans-serif at 16px base.
- **Monospace**: For technical content and code references (JetBrains Mono or system monospace).

### Design Principles

- **Dark-first**: Primary sections use the deep navy palette. Light sections used sparingly for contrast.
- **Professional and technical**: Clean layouts, generous whitespace, no visual clutter.
- **Trust signals**: Certifications, regulatory references, and institutional affiliations displayed prominently.
- **Responsive**: Mobile-first design using Bootstrap 5 grid and utilities.

---

## Tech Stack

| Layer        | Technology                         | Purpose                                  |
|--------------|------------------------------------|------------------------------------------|
| Frontend     | React 18+                          | Component-based UI                       |
| Build Tool   | Vite                               | Dev server, HMR, production bundling     |
| UI Framework | Bootstrap 5 (react-bootstrap)      | Responsive layout and styling            |
| State        | Redux Toolkit (RTK Query)          | State management and API communication   |
| Routing      | React Router v6+                   | Client-side routing                      |
| Backend      | Express.js                         | REST API server                          |
| SQL Database | PostgreSQL (Neon Tech)             | Customer requests, structured data       |
| NoSQL / Files| Firebase Firestore + Storage       | Document uploads and file metadata       |
| Auth         | Firebase Authentication            | JWT-based user and admin authentication  |
| Chatbot      | X.ai Grok API (RAG)               | AI-powered visitor engagement            |
| LinkedIn     | Third-party embed widget           | Company feed on landing page             |
| Testing      | Vitest, eslint-plugin-vitest, React Testing Library, Supertest | Unit, component, and API test suites |
| E2E Testing  | Playwright                         | End-to-end tests against Vercel previews |
| Linting      | ESLint + Prettier                  | Code quality enforcement                 |
| Linting Plugins | eslint-plugin-vitest            | Vitest globals recognition and test-specific rules |
| Deployment   | Vercel (Monorepo)                  | Two projects: `client/` + `server/`      |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** 9+
- A **Neon Tech** PostgreSQL database
- A **Firebase** project (Authentication, Firestore, Storage)
- An **X.ai** API key for the Grok chatbot

### Installation

```bash
# Clone the repository
git clone https://github.com/<org>/Ichnos_Protocol.git
cd Ichnos_Protocol

# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

### Configuration

Copy the example environment files and fill in your values:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

See [Environment Variables](#environment-variables) for the full list.

### Key Dependencies

Current versions (as of last update):

| Package                  | Version    | Purpose                                    |
|--------------------------|------------|--------------------------------------------|
| react                    | ^18.3.1    | UI library                                 |
| react-dom                | ^18.3.1    | React DOM renderer                         |
| react-helmet-async       | ^2.0.5     | SEO meta tags (React 18 compatible)        |
| vite                     | ^7.3.1     | Build tool and dev server                  |
| vitest                   | ^4.0.18    | Test runner                                |
| eslint                   | ^9.39.1    | Linter (flat config)                       |
| eslint-plugin-vitest     | ^0.5.4     | Vitest globals and test-specific rules     |

**Note**: React 18.x is used instead of React 19 due to `react-helmet-async@2.0.5` compatibility constraints.

### Running Locally

```bash
# Start the backend (from server/)
npm run dev

# Start the frontend (from client/)
npm run dev
```

### Unit, Component & API Tests (Vitest)

```bash
# Run all tests (from client/ or server/)
npm test

# Run a single test file
npm run test -- path/to/file.test.jsx

# Run with coverage
npm run test -- --coverage
```

**Vitest Configuration**

Vitest is configured with `globals: true` in `client/vite.config.js` (line 8), which injects test globals (`describe`, `it`, `expect`, `vi`) at runtime. ESLint recognizes these globals via `eslint-plugin-vitest@^0.5.4`, preventing `no-undef` errors in test files.

Client tests use `jsdom` environment; server tests use `node`. Vitest shares the Vite transform pipeline — JSX, ESM, and path aliases work without extra configuration.

### End-to-End Tests (Playwright)

```bash
# Start client + server locally first, then:
cd e2e && npx playwright test

# Run a single spec
cd e2e && npx playwright test tests/landing.spec.js

# Headed mode (visible browser)
cd e2e && npx playwright test --headed

# View HTML report
cd e2e && npx playwright show-report
```

In CI, Playwright runs automatically against Vercel preview deployment URLs via GitHub Actions — no need to start local servers.

### Linting and Formatting

```bash
npm run lint      # ESLint
npm run format    # Prettier
```

**ESLint Configuration**

The project uses ESLint 9 with flat config format (`eslint.config.js`). For test files, `eslint-plugin-vitest` is configured to:

- Recognize Vitest globals (`describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach`, etc.) — resolves `no-undef` errors
- Apply Vitest-specific lint rules (e.g., no focused tests, no disabled tests)
- Enforce test best practices

Test files are identified by the patterns: `**/*.{test,mock}.{js,jsx}`, `**/*.spec.{js,jsx}`, and `**/setupTests.js`.

---

## Claude Code MCP Servers

This project uses [Claude Code](https://claude.ai/claude-code) with four MCP (Model Context Protocol) servers that give the AI assistant direct access to the GitHub repository, the PostgreSQL database, Playwright for E2E testing, and up-to-date library documentation.

### Why MCP Servers?

Without MCP, Claude Code can only read/write local files and run shell commands. MCP servers extend its capabilities to interact directly with external services — querying the live database, managing GitHub issues and PRs, running browser tests, and looking up current API docs — all without leaving the coding session.

### Server Overview

| Server          | Package                        | Scope   | Purpose                                    |
|-----------------|--------------------------------|---------|--------------------------------------------|
| **GitHub**      | GitHub Copilot MCP (HTTP)      | User    | Issues, PRs, code search, branches, commits|
| **DBHub**       | `@bytebase/dbhub`             | Project | Query PostgreSQL directly                  |
| **Playwright**  | `@playwright/mcp`             | User    | Run E2E tests, browser automation          |
| **Context7**    | `@upstash/context7-mcp`       | User    | Library documentation lookup               |

### Scoping Rationale

MCP servers support three scopes that determine where the configuration is stored and when it applies:

- **User scope** (`--scope user`, stored in `~/.claude.json`) — The server is available in every project on the machine. Use this for tools that are project-agnostic: GitHub (works with any repo), Playwright (runs any test suite), and Context7 (looks up any library's docs).

- **Project scope** (`--scope project`, stored in the project's `.claude.json` entry) — The server is only available when working in this specific project. Use this when the server needs project-specific configuration. **DBHub uses project scope** because each project has its own `DATABASE_URL` in its `server/.env` file — the `dotenv-cli` wrapper loads that file at startup so the database connection always matches the current project.

- **Local scope** (default, stored in `~/.claude.json` under the project path) — Similar to project scope but not shareable. Useful for personal overrides.

### Prerequisites

- [Claude Code](https://claude.ai/claude-code) installed and authenticated
- Node.js 18+ and npm 9+ (for `npx` commands)
- A GitHub Personal Access Token (for GitHub MCP)
- The project's `server/.env` file configured with `DATABASE_URL` (for DBHub)

### Installation

Run these commands in a **terminal outside of Claude Code**. On Windows (non-WSL), stdio servers require the `cmd /c` wrapper.

#### 1. GitHub MCP (user scope)

```bash
claude mcp add --transport http github https://api.githubcopilot.com/mcp \
  --header "Authorization: Bearer <YOUR_GITHUB_PAT>"
```

Replace `<YOUR_GITHUB_PAT>` with a GitHub personal access token that has `repo` scope.

#### 2. Context7 (user scope)

```bash
claude mcp add --transport stdio context7 -- cmd /c npx -y @upstash/context7-mcp@latest
```

No API key required. Provides up-to-date documentation for React, Express, Playwright, Firebase, Bootstrap, Zod, and other libraries used in this project.

#### 3. Playwright (user scope)

```bash
claude mcp add --transport stdio playwright -- cmd /c npx -y @playwright/mcp --headless
```

Runs in headless mode by default. Claude can write, run, and iterate on E2E tests within a single session.

#### 4. DBHub — PostgreSQL (project scope)

```bash
# Run from the project root (Ichnos_Protocol/)
claude mcp add --transport stdio db --scope project \
  -- cmd /c "npx -y dotenv-cli -e server/.env -- npx -y @bytebase/dbhub"
```

This uses `dotenv-cli` to load `DATABASE_URL` from `server/.env` at startup. Each project gets its own database connection automatically — no secrets are hardcoded in the MCP configuration.

**For a new project**: Run this same command from that project's root directory (after creating its `server/.env` with `DATABASE_URL`).

### Verification

```bash
# List all servers and their connection status
claude mcp list

# Inside Claude Code, run:
/mcp
```

All four servers should show `Connected`. If any show `Failed to connect`:

1. **Check the command format** — On Windows, ensure `cmd /c` is used (not `cmd C:/`).
2. **Restart Claude Code** — MCP connections are established at session startup.
3. **Check `server/.env`** — For DBHub, ensure `DATABASE_URL` is set and the database is reachable.

### Removing Servers

```bash
claude mcp remove context7              # remove from default scope
claude mcp remove db --scope project    # remove project-scoped server
```

### macOS / Linux

On macOS or Linux, omit the `cmd /c` wrapper:

```bash
claude mcp add --transport stdio context7 -- npx -y @upstash/context7-mcp@latest
claude mcp add --transport stdio playwright -- npx -y @playwright/mcp --headless
claude mcp add --transport stdio db --scope project \
  -- npx -y dotenv-cli -e server/.env -- npx -y @bytebase/dbhub
```

---

## Project Structure

```
Ichnos_Protocol/
├── client/                        # React frontend
│   ├── public/
│   ├── src/
│   │   ├── app/                   # Store configuration, root providers
│   │   ├── components/
│   │   │   ├── atoms/             # Buttons, inputs, labels, icons
│   │   │   ├── molecules/         # Form groups, card headers, nav items
│   │   │   ├── organisms/         # Navbar, footer, chatbot, forms, LinkedIn feed
│   │   │   ├── templates/         # Page layouts (public, admin)
│   │   │   └── pages/             # Route-level components (thin wrappers)
│   │   ├── features/              # Redux slices + RTK Query APIs
│   │   │   ├── auth/
│   │   │   ├── chat/
│   │   │   ├── linkedin/
│   │   │   ├── requests/
│   │   │   └── services/
│   │   ├── hooks/                 # Custom reusable hooks
│   │   ├── helpers/               # Pure utility functions
│   │   ├── constants/             # App-wide constants and configuration
│   │   ├── routes/                # Route definitions and guards
│   │   └── index.jsx              # Entry point
│   ├── .env.example
│   ├── vercel.json                # Vercel frontend config (Vite, SPA rewrites)
│   ├── vite.config.js
│   └── package.json
├── server/                        # Express backend
│   ├── api/
│   │   └── index.js               # Vercel serverless entry point (wraps Express)
│   ├── src/
│   │   ├── config/                # DB connections, Firebase admin init, env
│   │   ├── controllers/           # Thin route handlers
│   │   ├── services/              # Business logic
│   │   ├── repositories/          # Data access (SQL, Firestore)
│   │   ├── middleware/            # Auth, error handling, validation
│   │   ├── routes/                # Express router definitions
│   │   ├── helpers/               # Pure utility functions
│   │   ├── validators/            # Request validation schemas (Zod / Joi)
│   │   └── app.js                 # Express app setup
│   ├── .env.example
│   ├── vercel.json                # Vercel backend config (serverless, rewrites)
│   └── package.json
├── e2e/                           # End-to-end tests (Playwright)
│   ├── tests/                     # Test specs (landing, services, chatbot, admin)
│   ├── fixtures/                  # Test data and auth state
│   ├── playwright.config.js       # Playwright configuration
│   └── package.json               # Playwright dependencies
├── .github/
│   └── workflows/
│       ├── ci.yml                 # GitHub Actions: Lint + unit tests on every PR
│       └── e2e.yml                # GitHub Actions: Playwright against Vercel previews
├── assets/                        # Brand assets (logo, images)
├── CLAUDE.md                      # Claude AI coding instructions
├── AGENTS.md                      # Shared agent conventions
└── README.md                      # This file
```

---

## Environment Variables

### Client (`client/.env`)

| Variable                            | Description                              |
|-------------------------------------|------------------------------------------|
| `VITE_API_BASE_URL`                | Backend API base URL                     |
| `VITE_FIREBASE_API_KEY`            | Firebase project API key                 |
| `VITE_FIREBASE_AUTH_DOMAIN`        | Firebase auth domain                     |
| `VITE_FIREBASE_PROJECT_ID`         | Firebase project ID                      |
| `VITE_FIREBASE_STORAGE_BUCKET`     | Firebase storage bucket                  |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Firebase messaging sender ID             |
| `VITE_FIREBASE_APP_ID`            | Firebase app ID                          |
| `VITE_LINKEDIN_WIDGET_ID`         | Third-party LinkedIn widget embed ID     |
| `VITE_LINKEDIN_PAGE_URL`          | Company LinkedIn page URL (fallback)     |

### Server (`server/.env`)

| Variable                        | Description                              |
|---------------------------------|------------------------------------------|
| `PORT`                          | Server port                              |
| `DATABASE_URL`                  | Neon Tech PostgreSQL connection string   |
| `FIREBASE_SERVICE_ACCOUNT_KEY`  | Path or JSON string for Firebase admin   |
| `XAI_API_KEY`                   | X.ai Grok API key                        |
| `XAI_API_BASE_URL`             | X.ai API base URL                        |
| `CORS_ORIGIN`                   | Allowed frontend origin                  |

---

## Deployment

The project is deployed on **Vercel** as a monorepo with two separate Vercel projects linked to the same Git repository.

### Architecture

| Component  | Vercel Project    | Root Directory | Runtime        | Output                 |
|------------|-------------------|----------------|----------------|------------------------|
| Frontend   | `ichnos-client`   | `client/`      | Vite (static)  | `dist/` (static site)  |
| Backend    | `ichnos-server`   | `server/`      | `@vercel/node` | Serverless function    |

### How It Works

**Frontend** — Vercel detects the Vite framework, runs `npm run build`, and serves the static `dist/` output. All routes rewrite to `index.html` for SPA client-side routing.

**Backend** — The Express app (`server/src/app.js`) is wrapped and exported from `server/api/index.js` as a Vercel serverless function. Vercel routes all incoming requests to this single function, which uses Express routing internally.

### Configuration Files

| File                   | Purpose                                                         |
|------------------------|-----------------------------------------------------------------|
| `client/vercel.json`   | Vite framework preset, build output, SPA rewrites               |
| `server/vercel.json`   | Serverless build config, `@vercel/node` runtime, API rewrites   |
| `server/api/index.js`  | Thin wrapper — imports and re-exports the Express app            |

### Deployment Flow

```
Push to main
    │
    ├── Vercel Project: ichnos-client
    │   └── npm run build → dist/ → CDN
    │
    └── Vercel Project: ichnos-server
        └── api/index.js → @vercel/node → Serverless function
```

- **Automatic deployments**: Merges to `main` trigger production builds for both projects.
- **Preview deployments**: Every pull request gets unique preview URLs for both frontend and backend.
- **Environment variables**: Configured in each Vercel project's settings dashboard (Production, Preview, Development scopes). Never committed to the repository.

### Manual Deploys (Vercel CLI)

```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy frontend
cd client && vercel --prod

# Deploy backend
cd server && vercel --prod
```

---

## Development Workflow

This project uses **Traycer AI** for planning and **Claude CLI** for execution.

### Traycer Integration

1. **Epic Definition** — Traycer defines the high-level feature.
2. **Phase Breakdown** — Traycer splits the epic into ordered phases (max 3 files each).
3. **Phase Planning** — Traycer produces a Markdown implementation plan with file references and step sequences.
4. **Execution** — Claude CLI implements the plan for the current phase.
5. **Verification** — Traycer compares the output to the plan and flags issues.

### Git Conventions

- **Branching**: `feature/<short-description>` from `main`.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) — `type(scope): description`.
- **Types**: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `style`.
- **Scopes**: `client`, `server`, `db`, `chat`, `auth`, `admin`, `linkedin`.

### Pre-Commit Checklist

- ESLint passes with zero warnings.
- Prettier formatting applied.
- All tests pass.
- No `.env` files or secrets staged.
- No files exceed 120 lines.

---

## Legal

**Ichnos Protocol Pte. Ltd.**
UEN: 202606521W
160 Robinson Road, #14-04 Singapore Business Federation Center, Singapore 068914
