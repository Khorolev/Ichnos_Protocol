# Ichnos Protocol

> Tracing the lifecycle of every battery — from first charge to second life.

**Ichnos Protocol Pte. Ltd.** builds the next-generation Battery Passport: a solution that goes beyond DIN SPEC 99100 compliance to deliver real utility for manufacturers, repurposers, remanufacturers, and SMEs seeking creative second-life applications for used batteries.

![Ichnos Protocol Logo](assets/Ichnos_Logo_832x832.png)

## Workflows

[![Vercel Preview (main PRs)](https://github.com/Khorolev/Ichnos_Protocol/actions/workflows/vercel-preview-on-main.yml/badge.svg)](https://github.com/Khorolev/Ichnos_Protocol/actions/workflows/vercel-preview-on-main.yml)
[![Promote to Production](https://github.com/Khorolev/Ichnos_Protocol/actions/workflows/promote-to-production.yml/badge.svg)](https://github.com/Khorolev/Ichnos_Protocol/actions/workflows/promote-to-production.yml)
[![Release Policy Check](https://github.com/Khorolev/Ichnos_Protocol/actions/workflows/release-policy-check.yml/badge.svg)](https://github.com/Khorolev/Ichnos_Protocol/actions/workflows/release-policy-check.yml)
[![Promote Vercel Preview to Production](https://github.com/Khorolev/Ichnos_Protocol/actions/workflows/vercel-promote-production.yml/badge.svg)](https://github.com/Khorolev/Ichnos_Protocol/actions/workflows/vercel-promote-production.yml)

---

## Table of Contents

- [Workflows](#workflows)
- [About the Company](#about-the-company)
- [The Founder](#the-founder)
- [The Battery Passport](#the-battery-passport)
- [Services](#services)
- [Website Pages](#website-pages)
- [Design System](#design-system)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Knowledge Base Management](#knowledge-base-management)
- [Development Workflow](#development-workflow)
- [Legal](#legal)

---

## About the Company

**Ichnos Protocol Pte. Ltd.** is registered in Singapore.

| Detail             | Value                                                                            |
| ------------------ | -------------------------------------------------------------------------------- |
| Legal Name         | Ichnos Protocol Pte. Ltd.                                                        |
| UEN                | 202606521W                                                                       |
| Registered Address | 160 Robinson Road, #14-04 Singapore Business Federation Center, Singapore 068914 |
| Jurisdiction       | Singapore                                                                        |

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

| Area                 | Detail                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| Academic Research    | RWTH Aachen University — circular economy for battery systems, with a focus on remanufacturing                 |
| Industry Experience  | Lead Expert, Battery Systems at FEV Europe                                                                     |
| Domain Expertise     | Battery system development, requirement management, legal and homologation requirements, EU Battery Regulation |
| Software Engineering | Full Stack Web Developer — trained at Sigma School, Puchong                                                    |
| Industry Background  | Motorcycle and automotive industries                                                                           |

### Vision

Dr.-Ing. Maltoni's work is driven by a core conviction: **batteries should live as long as possible**. Remanufacturing and repurposing are not just environmentally responsible — they are economically smart. The Battery Passport is the enabler, providing the transparency and data continuity that make second-life applications viable and scalable.

By combining deep domain expertise in battery engineering with hands-on software development skills, Dr.-Ing. Maltoni is uniquely positioned to build a Battery Passport solution that serves both regulatory compliance and real-world utility.

---

## The Battery Passport

### The Regulatory Context

The **EU Battery Regulation** mandates that batteries placed on the European market carry a digital passport — a structured dataset covering composition, performance, durability, and end-of-life handling. The **DIN SPEC 99100** standard provides a technical framework for implementing this passport.

### Beyond Compliance

Most Battery Passport solutions stop at the minimum required dataset. Ichnos Protocol goes further:

| Capability                           | Mandated | Ichnos Protocol |
| ------------------------------------ | -------- | --------------- |
| Composition and materials data       | Yes      | Yes             |
| Performance and durability metrics   | Yes      | Yes             |
| Carbon footprint declaration         | Yes      | Yes             |
| Supply chain due diligence           | Yes      | Yes             |
| **Remanufacturing readiness score**  | No       | Yes             |
| **Second-life application matching** | No       | Yes             |
| **SME marketplace integration**      | No       | Yes             |
| **Degradation forecasting**          | No       | Yes             |
| **Repurposer/remanufacturer tools**  | No       | Yes             |

### Technology Roadmap

The Battery Passport follows a staged technical architecture:

1. **Prototype Phase** (current) — SQL (PostgreSQL) and NoSQL (Firestore) databases for rapid iteration and validation of the data model.
2. **Production Phase** — Migration to **Solana blockchain** for immutable, decentralized battery lifecycle records with transparent provenance and interoperability.

The Solana choice aligns with the project's values: high throughput, low cost, and a growing ecosystem of sustainability-focused decentralized applications.

---

## Services

Ichnos Protocol offers consulting and development services for companies navigating the battery regulation landscape.

### Consulting Services

| Service                                     | Description                                                                                               |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Battery Regulation Compliance**           | Gap analysis, compliance roadmap, and documentation preparation for the EU Battery Regulation.            |
| **Homologation Support**                    | End-to-end support for type approval processes, including coordination with notified bodies in the EU.    |
| **Testing Center Coordination**             | Selection of and liaison with accredited testing centers for battery safety, performance, and durability. |
| **Requirement Management**                  | Structuring and managing technical, legal, and regulatory requirements for battery system development.    |
| **Battery Passport Development (In-House)** | Help your engineering team build a Battery Passport solution tailored to your products and processes.     |
| **Circular Economy Strategy**               | Advisory on remanufacturing, repurposing, and second-life strategies to maximize battery asset value.     |

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

| Section               | Content                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Hero**              | Tagline, one-sentence value proposition, primary CTA ("Get in Touch" / "Explore Services").                 |
| **Problem Statement** | The EU Battery Regulation challenge — what companies face and what's at stake.                              |
| **Solution Overview** | The Ichnos Battery Passport — compliance plus real utility, in a brief visual summary.                      |
| **Why Ichnos**        | Three to four differentiators: domain depth, beyond-compliance features, competitive rates, ASEAN+EU reach. |
| **Services Snapshot** | Card grid previewing key services, linking to the full Services page.                                       |
| **LinkedIn Feed**     | Latest company posts via embedded widget — signals activity and thought leadership.                         |
| **CTA / Contact**     | Closing call to action — directs to the chatbot contact flow or a contact form.                             |

#### Team Page (`/team`)

Builds trust through transparency. Shows who is behind the company.

| Section               | Content                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| **Founder Profile**   | Photo, name, title, bio summarizing academic and industry background (see [The Founder](#the-founder)). |
| **Expertise Areas**   | Visual representation of core competencies (battery systems, regulation, software).                     |
| **Career Highlights** | Key milestones: RWTH Aachen research, FEV Europe role, Sigma School, company founding.                  |
| **Vision Statement**  | The circular economy mission and what drives the company.                                               |

> As the team grows, this page will expand to include additional team members with consistent card-based profiles.

#### Services Page (`/services`)

The commercial core. Details what Ichnos Protocol offers and showcases the Battery Passport product.

| Section                       | Content                                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Services Overview**         | Introduction to the consulting and development offerings.                                                      |
| **Service Cards**             | One card per service (see [Services](#services)) with description and CTA.                                     |
| **Battery Passport Showcase** | Dedicated section explaining the product: features, compliance scope, technology roadmap, and differentiators. |
| **How It Works**              | Step-by-step visual flow: data collection, passport creation, lifecycle tracking, second-life enablement.      |
| **Target Industries**         | Automotive, motorcycle, energy storage, industrial equipment, marine.                                          |
| **CTA**                       | "Discuss Your Needs" — triggers chatbot contact flow or links to contact.                                      |

### Admin Pages

#### Admin Dashboard (`/admin/requests`)

Internal tool for managing inbound customer inquiries.

| Feature                | Description                                                         |
| ---------------------- | ------------------------------------------------------------------- |
| **Request Table**      | Name, email, company, message preview, status, date, document link. |
| **Status Management**  | Update status: `new` → `in_progress` → `resolved`.                  |
| **Document Access**    | View/download uploaded files from Firestore.                        |
| **Filtering & Search** | Filter by status, date range, or keyword.                           |

### Chatbot (All Public Pages)

A persistent AI-powered assistant available on every public page.

| Capability          | Description                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| **Company Q&A**     | Answers questions about Ichnos Protocol, services, pricing, and expertise. |
| **Contact Flow**    | Collects name, email, company, message — creates a customer request.       |
| **Document Upload** | Accepts file uploads (PDF, DOCX, PNG, JPG, max 10MB) as part of inquiries. |
| **RAG-Powered**     | Responses grounded in a curated knowledge base about the company.          |

---

## Design System

### Color Palette

The color palette is derived from the **company logo** (a tree with circuit-board roots against a deep navy background with luminous blue highlights and golden accents) and aligned with the **Solana ecosystem** aesthetic.

| Role               | Color           | Hex       | Usage                                           |
| ------------------ | --------------- | --------- | ----------------------------------------------- |
| **Primary Dark**   | Deep Navy       | `#0A1628` | Backgrounds, hero sections, footer              |
| **Primary**        | Luminous Blue   | `#1E90FF` | Links, buttons, interactive elements            |
| **Accent**         | Cyan / Teal     | `#00D1C1` | Highlights, hover states, secondary CTAs        |
| **Accent Warm**    | Golden Amber    | `#C8A24E` | Accents, badges, premium indicators             |
| **Gradient Start** | Solana Teal     | `#14F195` | Gradient accents (Solana alignment)             |
| **Gradient End**   | Solana Purple   | `#9945FF` | Gradient accents (Solana alignment)             |
| **Surface**        | Slate Blue      | `#1A2744` | Cards, panels, elevated surfaces                |
| **Text Primary**   | Off-White       | `#E8ECF1` | Body text on dark backgrounds                   |
| **Text Secondary** | Muted Blue-Gray | `#8B9DC3` | Secondary text, captions, metadata              |
| **Background Alt** | Light Gray      | `#F5F7FA` | Light-mode sections, alternating content blocks |
| **Text Dark**      | Charcoal        | `#1A1A2E` | Body text on light backgrounds                  |

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

| Layer           | Technology                                                     | Purpose                                            |
| --------------- | -------------------------------------------------------------- | -------------------------------------------------- |
| Frontend        | React 18+                                                      | Component-based UI                                 |
| Build Tool      | Vite                                                           | Dev server, HMR, production bundling               |
| UI Framework    | Bootstrap 5 (react-bootstrap)                                  | Responsive layout and styling                      |
| State           | Redux Toolkit (RTK Query)                                      | State management and API communication             |
| Routing         | React Router v6+                                               | Client-side routing                                |
| Backend         | Express.js                                                     | REST API server                                    |
| SQL Database    | PostgreSQL (Neon Tech)                                         | Customer requests, structured data                 |
| NoSQL / Files   | Firebase Firestore + Storage                                   | Document uploads and file metadata                 |
| Auth            | Firebase Authentication                                        | JWT-based user and admin authentication            |
| Chatbot         | X.ai Grok API (RAG)                                            | AI-powered visitor engagement                      |
| LinkedIn        | Third-party embed widget                                       | Company feed on landing page                       |
| Testing         | Vitest, eslint-plugin-vitest, React Testing Library, Supertest | Unit, component, and API test suites               |
| E2E Testing     | Playwright                                                     | End-to-end tests against Vercel previews           |
| Linting         | ESLint + Prettier                                              | Code quality enforcement                           |
| Linting Plugins | eslint-plugin-vitest                                           | Vitest globals recognition and test-specific rules |
| Deployment      | Vercel (Monorepo)                                              | Two projects: `client/` + `server/`                |

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

| Package              | Version | Purpose                                |
| -------------------- | ------- | -------------------------------------- |
| react                | ^18.3.1 | UI library                             |
| react-dom            | ^18.3.1 | React DOM renderer                     |
| react-helmet-async   | ^2.0.5  | SEO meta tags (React 18 compatible)    |
| vite                 | ^7.3.1  | Build tool and dev server              |
| vitest               | ^4.0.18 | Test runner                            |
| eslint               | ^9.39.1 | Linter (flat config)                   |
| eslint-plugin-vitest | ^0.5.4  | Vitest globals and test-specific rules |

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
│       ├── vercel-preview-on-main.yml       # Unified PR gate: CI + preview deploy + E2E (PRs to main)
│       ├── promote-to-production.yml        # Production promotion on push to release (approval-gated)
│       ├── release-policy-check.yml         # Policy gate: confirms PR head is main before release merge
│       ├── vercel-promote-production.yml    # Emergency manual production promotion
│       └── e2e.yml                          # Manual/ad-hoc Playwright run via workflow_dispatch
├── assets/                        # Brand assets (logo, images)
├── CLAUDE.md                      # Claude AI coding instructions
├── AGENTS.md                      # Shared agent conventions
├── GITHUB_SETTINGS.md             # GitHub repository settings reference
├── VERCEL_SETTINGS.md             # Vercel project settings reference
└── README.md                      # This file
```

---

## Environment Variables

See `server/.env.example` and `client/.env.example` for the full list of required variables with descriptions.

---

## Deployment

### Full Deployment Guide

For complete step-by-step deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

The project is deployed on **Vercel** as a monorepo with two separate Vercel projects linked to the same Git repository.

### Architecture

| Component | Vercel Project  | Root Directory | Runtime        | Output                |
| --------- | --------------- | -------------- | -------------- | --------------------- |
| Frontend  | `ichnos-client` | `client/`      | Vite (static)  | `dist/` (static site) |
| Backend   | `ichnos-server` | `server/`      | `@vercel/node` | Serverless function   |

### How It Works

**Frontend** — Vercel detects the Vite framework, runs `npm run build`, and serves the static `dist/` output. All routes rewrite to `index.html` for SPA client-side routing.

**Backend** — The Express app (`server/src/app.js`) is wrapped and exported from `server/api/index.js` as a Vercel serverless function. Vercel routes all incoming requests to this single function, which uses Express routing internally.

### Configuration Files

| File                  | Purpose                                                       |
| --------------------- | ------------------------------------------------------------- |
| `client/vercel.json`  | Vite framework preset, build output, SPA rewrites             |
| `server/vercel.json`  | Serverless build config, `@vercel/node` runtime, API rewrites |
| `server/api/index.js` | Thin wrapper — imports and re-exports the Express app         |

### Deployment Flow

The project follows a **2-branch deployment model**:

```
feature/* → main (PR-gated: CI + Deploy + E2E)
    → release (PR from main only, Release Policy Check required)
        → production (environment approval required, promote-only model)
```

- **Preview deployments**: PRs targeting `main` get unique preview URLs for both frontend and backend, used by the E2E gate.
- **Production deployments**: Merges to `release` trigger `promote-to-production.yml`, which discovers the latest READY `main` preview and promotes it — no rebuild. Requires human approval via the GitHub `production` environment.
- **Environment variables**: Configured in each Vercel project's settings dashboard (Production, Preview, Development scopes). Never committed to the repository.

For the authoritative CI/CD reference, see [`DEPLOYMENT_GITHUB_ACTIONS.md`](DEPLOYMENT_GITHUB_ACTIONS.md). For infrastructure setup, see [`DEPLOYMENT.md`](DEPLOYMENT.md). For GitHub settings, see [`GITHUB_SETTINGS.md`](GITHUB_SETTINGS.md). For Vercel settings, see [`VERCEL_SETTINGS.md`](VERCEL_SETTINGS.md).

### Manual Deploys (Vercel CLI)

> **Emergency use only.** These commands bypass CI, E2E, and approval gates. Use only when GitHub Actions is unavailable or broken.

```bash
# Deploy frontend
cd client && npx vercel --prod

# Deploy backend
cd server && npx vercel --prod
```

### Cron Jobs

Two scheduled jobs run automatically via Vercel Cron (configured in `server/vercel.json`):

| Job             | Path                              | Schedule                                |
| --------------- | --------------------------------- | --------------------------------------- |
| Retention Sweep | `/api/admin/retention-sweep`      | `0 2 * * 0` — Every Sunday at 02:00 UTC |
| Email Digest    | `/api/admin/notifications/digest` | `0 9 * * *` — Every day at 09:00 UTC    |

Cron endpoints are invoked via `GET` by Vercel's scheduler and authenticated via `Authorization: Bearer CRON_SECRET`. Admin users can also trigger them manually via `POST` with a Firebase admin token.
See [DEPLOYMENT.md](DEPLOYMENT.md) for setup and verification instructions.

---

## Knowledge Base Management

The RAG chatbot is powered by a Firestore `knowledge_base` collection populated through four extraction pipelines.

### Pipelines Overview

| Pipeline       | Purpose                     | Command                                                                       |
| -------------- | --------------------------- | ----------------------------------------------------------------------------- |
| Manual Seeding | Company info, services      | `node server/scripts/seedKnowledgeBase.js`                                    |
| Simple PDF     | Text-only PDFs              | `node server/scripts/extractPdfKnowledgeLegacy.js <file.pdf>`                 |
| Complex PDF    | Tables, equations, diagrams | `python .../convertPdfToMarkdown.py` + `node .../extractMarkdownKnowledge.js` |
| Web Content    | Catena-X, GBA, standards    | `node server/scripts/extractWebKnowledge.js <url>`                            |

### Quick Start Examples

```bash
# Seed company knowledge
node server/scripts/seedKnowledgeBase.js

# Extract from a complex PDF (two-step)
python server/scripts/python/convertPdfToMarkdown.py --input spec.pdf --output-dir ./markdown
node server/scripts/extractMarkdownKnowledge.js ./markdown/spec.md --category batteries

# Extract from Catena-X standard
node server/scripts/extractWebKnowledge.js \
  https://catenax-ev.github.io/docs/next/standards/CX-0143 \
  --category regulations
```

For complete workflow documentation, troubleshooting, and periodic update procedures, see [`server/scripts/README.md`](server/scripts/README.md).

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
