# New Design Epic — Ichnos Protocol Aesthetic Upgrade

> Source-of-truth epic document for Traycer AI execution.
> Mirrors the approved Claude plan at `~/.claude/plans/c-users-malto-downloads-update-website-sharded-rabbit.md`.

## Context

The Ichnos Protocol website is being repositioned around a clearer brand split:

- **Advisory** (the company's core service offering — battery compliance consulting) takes over the public surfaces (`/`, `/services`, `/team`, `/contact`). Visual tone shifts from the current "crypto-leaning Solana" palette to a **premium-consulting** look: charcoal/navy base, cyan + warm-gold accents, gradient text reserved as a *single* signature moment on the headline.
- **Battery Passport** (the SaaS product) is moved out of `/services` into its own `/passport` route. The current dark navy + Solana green→purple gradient theme is **retained** there because it suits a tech product showcase.

Concurrently:

- Inquiries email migrates from `maltonif@gmail.com` to `francesco@ichnos-protocol.com`.
- A new Co-Founder, **Ihsan Ahmad**, is added to the Team page. His timeline (AI / Data / Finance — no battery history per his LinkedIn PDF) is wired up but hidden behind a `showTimeline: false` flag so it doesn't dilute the battery-advisory positioning.
- New brand assets land: white + dark "ICHNOS Battery Advisory" lockup logos, a regenerated favicon. The legacy mark is retired everywhere except the Passport page (where it stays as the product mark).
- Footer is redesigned — 4-column layout with a dark-tinted, open-source battery photo as background and a small attribution line.
- Hero is redesigned per the reference: gradient headline ("From regulatory compliance to real, user-friendly circularity") on a dark grey background with a single "Explore Our Services" CTA.

The change is **client-only** (no server, no DB, no auth). It must keep the existing React 18 + Bootstrap 5 + Atomic Design conventions enforced by `CLAUDE.md` (functional components, ≤120 lines/file, ≤60 lines JSX, `react-bootstrap` components, RTK Query for any data calls, no inline styles, default-export components).

Source assets supplied by the user, located at `C:\Users\malto\Downloads\update_website_v1-20260507T072102Z-3-001\update_website_v1\`:
- `Ttransparent_white.png` — white "ICHNOS Battery Advisory" lockup (for dark surfaces)
- `Ttransparent_black.png` — dark "ICHNOS Battery Advisory" lockup (for light surfaces / favicon source)
- `CV Ihsan.docx` — bio copy for Ihsan
- `finalized design.docx` — design notes (German) + 8 reference images describing the visual direction

Plus `C:\Users\malto\Downloads\Profile.pdf` — Ihsan's LinkedIn export, used to seed the (hidden) career timeline.

---

## Design principles guiding this epic

1. **Two themes, one identity.** The Ichnos mark (corporate logo) is global. Theme classes (`theme-advisory`, `theme-passport`) on a route's outermost wrapper switch palette tokens — no separate components per theme.
2. **Premium-consulting palette for Advisory.** Charcoal base (`#1C1F26`), preserved navy `#0A1628` for sections, `--color-accent-cyan` for interactivity, `--color-accent-warm: #C8A24E` (already declared) for "premium" highlights. Solana gradient `#14F195 → #9945FF` is reserved for **the landing-hero headline only**.
3. **Solana theme retained on `/passport`.** Current tokens unchanged; only scoped under `.theme-passport`.
4. **Surgical changes.** Reuse existing organisms (`Hero`, `Footer`, `FounderProfile`, `CareerTimeline`, `ServicesList`, etc.) — extend, don't rewrite. Atomic Design boundaries from §4 of `CLAUDE.md` are preserved.
5. **Asset hygiene.** All new images go under `client/public/`. Stock photos sourced from Unsplash with attribution noted in the footer.
6. **Two footer proposals delivered.** User picks at end of Phase 4 — both behind a one-line flag in `Footer.jsx`.

---

## Phase map

| # | Phase | Files (≤3) | Risk |
|---|---|---|---|
| 1 | Email + brand assets (logos, favicon) | `companyInfo.js`, `client/public/*` (asset replacements) | low |
| 2 | Design-token overhaul + theme scoping | `client/src/index.css` | medium — touches every page visually |
| 3 | Landing hero redesign | `landingContent.js`, `Hero.jsx`, `index.css` (hero block) | low |
| 4 | Footer redesign — Proposal A **and** B behind flag | `Footer.jsx`, `index.css` (footer block), `client/public/footer-bg.jpg` | low |
| 5 | Team data model — add Ihsan + `showTimeline` flag | `teamContent.js`, `client/public/ihsan.png` | low |
| 6 | Team render — multi-member support | `TeamPage.jsx`, `FounderProfile.jsx`, `CareerTimeline.jsx` | low |
| 7 | Navigation + SEO scaffolding for Passport split | `navigation.js`, `seo.js` + `seoMeta.js`, `App.jsx` | medium — routing change |
| 8 | Passport page migration (content carve-out) | `PassportPage.jsx` (new), `ServicesPage.jsx`, `services.js` (or new `passportContent.js`) | high — content split, theme switch |
| 9 | Advisory pages coherence sweep | `ServicesPage.jsx`, `TeamPage.jsx`, `index.css` (hero variants) | low |

---

## Phase 1 — Email + brand assets

**Files**
- `client/src/constants/companyInfo.js`
- `client/public/logo.png` (replace with `Ttransparent_white.png`)
- `client/public/logo-dark.png` (new — `Ttransparent_black.png` for light backgrounds, e.g., footer column 1 if needed)
- `client/public/logo-legacy.png` (rename current `logo.png` to keep for `/passport`)
- `client/public/favicon.png` (regenerate from the icon-only "≡" portion of the new mark, 256×256 → output a 32×32 favicon)

**Changes**
1. `companyInfo.js`: `email: "francesco@ichnos-protocol.com"`. Leave `linkedInFounder` and `calendly` unchanged (confirmed current).
2. Asset swap: copy white logo to `logo.png`; preserve old `logo.png` as `logo-legacy.png`. The `Logo` atom (`atoms/Logo.jsx`) reads from a constant — extend it in Phase 8 to switch by theme.
3. Favicon: regenerate from `Ttransparent_black.png` (icon glyph only — crop the cyan stripes square). Link in `client/index.html` already points to `/favicon.png` — no markup change needed.

**Verification**
- `npm run dev` in `client/` → navbar shows new white logo on dark navbar.
- Browser tab favicon refreshes (hard reload).
- `git grep maltonif@gmail.com client/` returns zero matches.

---

## Phase 2 — Design-token overhaul + theme scoping

**Files**
- `client/src/index.css` (only)

**Changes**

Refactor `:root` to declare **base tokens** (typography, spacing, transitions, z-index — unchanged) and split palette into two scoped theme blocks:

```css
:root {
  /* Typography / spacing / transitions / z — unchanged from current */
}

/* Default = advisory theme (applies everywhere unless overridden) */
.theme-advisory, body {
  --color-bg-base: #1C1F26;          /* charcoal — premium consulting */
  --color-bg-alt: #0A1628;           /* deep navy for section variation */
  --color-surface: #232732;
  --color-text-primary: #E8ECF1;
  --color-text-secondary: #9AA5B8;
  --color-accent-primary: #1E90FF;
  --color-accent-cyan: #00D1C1;
  --color-accent-warm: #C8A24E;      /* gold — premium signature */
  --color-gradient-start: #14F195;   /* used ONLY on landing hero headline */
  --color-gradient-end: #9945FF;
}

.theme-passport {
  --color-bg-base: #0A1628;          /* current Solana navy retained */
  --color-bg-alt: #1A2744;
  --color-surface: #1A2744;
  --color-text-primary: #E8ECF1;
  --color-text-secondary: #8B9DC3;
  --color-accent-primary: #1E90FF;
  --color-accent-cyan: #00D1C1;
  --color-accent-warm: #C8A24E;
  --color-gradient-start: #14F195;   /* gradient used liberally — product showcase */
  --color-gradient-end: #9945FF;
}
```

Replace **every** hard-coded usage of the old `--color-primary-dark` / `--color-surface` etc. with the new variable names (`--color-bg-base`, `--color-bg-alt`). Sections currently styled with `solution-section { background: var(--color-surface) }` etc. continue to work because variables resolve correctly under the active theme.

Add hero-section variant: `.hero-section--advisory` (charcoal, no gradient bg) vs `.hero-section--passport` (current behaviour, retained).

**Verification**
- Visual diff of `/` (will look new), `/services` (slightly cooler/warmer), `/team` (similar) — no broken styling.
- All existing component tests still pass (`npm run test --workspace client` from repo root).

---

## Phase 3 — Landing hero redesign

**Files**
- `client/src/constants/landingContent.js`
- `client/src/components/organisms/Hero.jsx`
- `client/src/index.css` (`.hero-section--advisory` block)

**Changes**

1. `landingContent.js`: replace hero copy with:
   - `title`: `"From regulatory compliance to real, user-friendly circularity"` (rendered with `gradient-text` class)
   - `subtitle`: `"Ichnos Protocol delivers consultancy services and is developing its own digital battery passport solution, to benefit all stakeholders in the battery circular value chain."`
   - `ctaPrimary`: `{ label: "Explore Our Services", to: "/services" }`
   - Remove the secondary CTA (single-CTA per reference image 5).
2. `Hero.jsx`: render `<h1 className="gradient-text fw-bold">` for title; subtitle in `section-subtext`; one `<Button>` linking to `/services`. Apply `hero-section--advisory` wrapper class. Keep file under 60 lines JSX.
3. `index.css`: `.hero-section--advisory` uses `background-color: var(--color-bg-base);` (no gradient bg — gradient appears only on the headline). Min-height stays `85vh`. Existing `.hero-cta-btn` class repurposed with new gradient.

**Verification**
- Open `/` → big gradient headline matches reference image 5; subtitle reads as written; CTA navigates to `/services`.
- Lighthouse contrast check: headline gradient must score ≥ AA on charcoal background (verify in DevTools).

---

## Phase 4 — Footer redesign (two proposals behind a flag)

**Files**
- `client/src/components/organisms/Footer.jsx`
- `client/src/index.css` (footer block — replace lines 168–183)
- `client/public/footer-bg.jpg` (Unsplash, license-free; candidate: `https://unsplash.com/photos/w7ZyuGYNpRQ` (battery cells) or similar — final choice committed under this filename)

**Changes**

Add a constant at the top of `Footer.jsx`:
```js
const FOOTER_VARIANT = "B"; // "A" or "B" — see docs/newDesignEpic.md §Phase 4
```

**Proposal A — Compact 4-col, trimmed content** (matches user's text spec literally)

| Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|
| New ICHNOS logo + tagline `"Battery Advisory"` + 3 social icons | Nav: About Us · Services · Team · Contact | Email + LinkedIn link | Address + UEN |

**Proposal B — Image-4 layout with our content** (matches reference image 4 visual)

| Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|
| Logo + 1-paragraph company description + 3 social icons | "Company": About Us · Services · Team | "Solutions": Battery Advisory · Battery Passport | "Contact": email · LinkedIn · address |

Both share:
- Background: `linear-gradient(rgba(28,31,38,0.88), rgba(10,22,40,0.95)), url('/footer-bg.jpg') center/cover no-repeat;`
- Bottom row: `© 2026 Ichnos Protocol Pte. Ltd. — All rights reserved. · Photo: Unsplash` (small `.footer-attribution` class, 11px, low-contrast secondary text).
- React-bootstrap `Container` + `Row` + `Col`. Mobile: columns stack.

Keep `Footer.jsx` ≤120 lines. Extract each proposal's column block into a small render helper (still in-file, ≤20 lines each).

**Verification**
- Toggle `FOOTER_VARIANT` → both render correctly desktop & mobile (Bootstrap `lg` breakpoint).
- Background image readable: text contrast ≥ AA against the dark overlay.
- All footer links navigate correctly. Email opens mail client. LinkedIn opens new tab.

---

## Phase 5 — Team data model: add Ihsan + `showTimeline` flag

**Files**
- `client/src/constants/teamContent.js`
- `client/public/ihsan.png` (placeholder — initials silhouette; Phase 6 reuses the existing `founder-photo-fallback` if image missing)

**Changes**

Replace `FOUNDER_PROFILE` with `TEAM_MEMBERS` array:

```js
export const TEAM_MEMBERS = [
  {
    id: "francesco",
    name: "Dr.-Ing. Francesco Maltoni",
    title: "Founder & Lead Consultant",
    photo: "/founder.png",
    bio: [ /* unchanged */ ],
    showTimeline: true,
    timeline: CAREER_TIMELINE_FRANCESCO, // current array, renamed
  },
  {
    id: "ihsan",
    name: "Ihsan Ahmad",
    title: "Co-Founder",
    photo: "/ihsan.png",
    bio: [
      "Ihsan Ahmad is Co-Founder with years of experience in EU regulatory frameworks and technical compliance management within the battery industry.",
      "As a Technomathematician, he combines analytical problem-solving with deep technical and regulatory expertise, supporting companies in navigating complex battery certification and compliance processes.",
      "His expertise includes EU Battery Regulation compliance, Battery Passport systems, requirement management, homologation support, and coordination with testing and certification bodies.",
    ],
    showTimeline: false, // hidden — LinkedIn shows AI/Data/Finance, not battery; flip to true after content review
    timeline: CAREER_TIMELINE_IHSAN, // pre-populated from LinkedIn (see below)
  },
];

const CAREER_TIMELINE_IHSAN = [
  { id: "kit-msc", year: "2015 – 2018", title: "M.Sc. Wirtschaftsmathematik", organization: "Karlsruher Institut für Technologie", description: "Master's in Business Mathematics." },
  { id: "deka", year: "2018 – 2020", title: "Equity Derivatives Valuation", organization: "Deka Investment", description: "Valuation of equities, derivatives and bond options; built MySQL data warehouse; Python valuation models." },
  { id: "badenia", year: "2020 – 2021", title: "Quantitative Risk Manager", organization: "Deutsche Bausparkasse Badenia AG", description: "IFRS9 sub-project lead; IRBA data models; risk-bearing capacity." },
  { id: "hep-saa", year: "2021 – 2022", title: "Senior Associate Investment Analyst", organization: "HEP Kapitalverwaltung AG", description: "Investment analysis." },
  { id: "hep-dt", year: "2024", title: "Expert Digital Transformation", organization: "hep solar", description: "Digital transformation initiatives." },
  { id: "hep-ai", year: "2024 – 2025", title: "Head of Artificial Intelligence & Data", organization: "hep solar", description: "AI & data strategy." },
  { id: "ai-projects", year: "2023 – Present", title: "Founder & Geschäftsführer", organization: "AI PROJECTS GMBH", description: "AI-driven business-process digitisation; tech start-up consulting; fintech development." },
  { id: "conlution", year: "2025 – Present", title: "Managing Director", organization: "Conlution", description: "AI workshops; SME AI consulting." },
  { id: "ichnos", year: "2026 – Present", title: "Co-Founder", organization: "Ichnos Protocol Pte. Ltd.", description: "Co-founded to build EU-compliant Battery Passport solutions." },
];
```

Update `TEAM_PAGE_HEADER`:
```js
export const TEAM_PAGE_HEADER = {
  title: "Meet the Team",
  subtitle: "The expertise and vision behind Ichnos Protocol.",
};
```

`VISION_STATEMENT`, `CORE_COMPETENCIES`, `SECTION_HEADINGS` unchanged.

Keep file ≤120 lines (move the two timeline arrays above `TEAM_MEMBERS` declaration; extract them to a sibling `client/src/constants/teamTimelines.js` if line count exceeds — defer that decision to implementation time).

**Verification**
- `import { TEAM_MEMBERS } from "constants/teamContent"` returns 2 entries.
- `TEAM_MEMBERS[1].showTimeline === false`.

---

## Phase 6 — Team render: multi-member support

**Files**
- `client/src/components/pages/TeamPage.jsx`
- `client/src/components/organisms/FounderProfile.jsx`
- `client/src/components/organisms/CareerTimeline.jsx`

**Changes**

1. `TeamPage.jsx`: map `TEAM_MEMBERS.map((m) => <FounderProfile key={m.id} member={m} />)`. Keep page ≤30 lines as per §4.3 of CLAUDE.md.
2. `FounderProfile.jsx`: accept `member` prop; render its `name`, `title`, `photo`, `bio`. After bio, if `member.showTimeline`, render `<CareerTimeline timeline={member.timeline} />`. Photo fallback uses `founder-photo-fallback` class with member initials.
3. `CareerTimeline.jsx`: accept `timeline` prop instead of importing the constant. Same render logic.

**Verification**
- `/team` shows two profile blocks: Francesco (with timeline), Ihsan (no timeline).
- Toggle `TEAM_MEMBERS[1].showTimeline = true` locally → Ihsan's timeline appears.
- Component tests in `TeamPage.test.jsx`, `FounderProfile.test.jsx` (if exists), `CareerTimeline.test.jsx` updated to pass `member` / `timeline` props.

---

## Phase 7 — Navigation + SEO scaffolding for Passport split

**Files**
- `client/src/constants/navigation.js`
- `client/src/constants/seo.js` + `client/src/constants/seoMeta.js`
- `client/src/App.jsx`

**Changes**

1. `navigation.js`: add a `Products` dropdown (or single "Passport" link) — choose dropdown to leave room for future products. Existing `NavDropdown` molecule already supports this.
2. `seoMeta.js` / `seo.js`: add a `passport` entry — title `"Battery Passport — Ichnos Protocol"`, description per EU Battery Regulation pitch.
3. `App.jsx`: register `/passport` route inside the `PublicLayout` `<Routes>`. Stub it to render `<PassportPage />` (component arrives in Phase 8 — temporarily render a "Coming soon" placeholder so this phase can ship and be E2E-tested independently).

**Verification**
- Navbar shows new Products / Passport entry.
- Visiting `/passport` renders the placeholder page wrapped in `PublicLayout`.
- `/services` and `/team` SEO meta unchanged.

---

## Phase 8 — Passport page migration (content carve-out)

**Files**
- `client/src/components/pages/PassportPage.jsx` **(new)**
- `client/src/components/pages/ServicesPage.jsx`
- `client/src/constants/services.js` (split into advisory-only) — *and* `client/src/constants/passportContent.js` **(new)** if content volume warrants

**Changes**

1. **Carve content**: move the Passport-specific copy used by `FeatureMaturityMatrix` and `TechnologyRoadmap` from `services.js` into `passportContent.js`. Keep advisory `ServicesList` data in `services.js`.
2. `PassportPage.jsx`: wrap entire page in `<div className="theme-passport">…</div>` so palette tokens flip to Solana scheme. Sections inside: hero (Solana gradient + dark navy), `FeatureMaturityMatrix`, `TechnologyRoadmap`, `ContactSection`. Use the **legacy** logo (`/logo-legacy.png`) inside the hero — clearest place to express "this is the product".
3. `ServicesPage.jsx`: remove `FeatureMaturityMatrix` and `TechnologyRoadmap` imports/usage. Keep `ServicesList` + `ContactSection`. Add the dark-tinted-battery banner hero per reference image 1 (page header in advisory tone — see Phase 9 for the shared hero variant).
4. Cross-link: `ServicesList` mentions Battery Passport with a `<Link to="/passport">Learn more</Link>` chip.

Each file stays ≤120 lines; if `PassportPage.jsx` grows beyond 60 lines JSX, extract a `PassportHero` organism.

**Verification**
- `/services` no longer contains the maturity matrix or roadmap.
- `/passport` shows the dark Solana theme with maturity matrix + roadmap. Toggle DevTools → confirm CSS variables resolve to Solana values inside `.theme-passport`.
- Existing tests for `ServicesPage` and any matrix/roadmap test files updated to reflect new home.

---

## Phase 9 — Advisory pages coherence sweep

**Files**
- `client/src/components/pages/ServicesPage.jsx`
- `client/src/components/pages/TeamPage.jsx`
- `client/src/index.css` (add `.advisory-page-hero` variant)

**Changes**

1. Add `.advisory-page-hero` class — dark navy background, centered `h1.page-title` + lead subtitle, `padding: var(--spacing-3xl) 0;`. Reuses the `--color-bg-alt` token (deep navy) — matches reference image 1.
2. `ServicesPage.jsx` header section uses `<header className="advisory-page-hero">…</header>`.
3. `TeamPage.jsx` header section uses the same wrapper.
4. Visual continuity: charcoal page body, navy hero, gold accent on hover for service cards (`.service-card:hover { border-color: var(--color-accent-warm); }` overrides previous cyan — premium consulting note).

**Verification**
- All four public pages (`/`, `/services`, `/team`, `/contact`) feel like one cohesive advisory site.
- `/passport` is visibly distinct (Solana, neon green→purple gradient, dark navy).
- Run `npm run lint --workspace client` — zero warnings.
- Run `npm run test --workspace client` — all tests green.
- Manual smoke: scroll each page, click each nav entry, click each footer link.

---

## Critical files reference

| Path | Modified in phase |
|---|---|
| `client/src/constants/companyInfo.js` | 1 |
| `client/src/constants/landingContent.js` | 3 |
| `client/src/constants/teamContent.js` | 5 |
| `client/src/constants/services.js` | 8 |
| `client/src/constants/passportContent.js` (new) | 8 |
| `client/src/constants/navigation.js` | 7 |
| `client/src/constants/seo.js`, `seoMeta.js` | 7 |
| `client/src/index.css` | 2, 3, 4, 9 |
| `client/src/App.jsx` | 7 |
| `client/src/components/organisms/Hero.jsx` | 3 |
| `client/src/components/organisms/Footer.jsx` | 4 |
| `client/src/components/organisms/FounderProfile.jsx` | 6 |
| `client/src/components/organisms/CareerTimeline.jsx` | 6 |
| `client/src/components/pages/TeamPage.jsx` | 6, 9 |
| `client/src/components/pages/ServicesPage.jsx` | 8, 9 |
| `client/src/components/pages/PassportPage.jsx` (new) | 7 (stub), 8 |
| `client/public/logo.png`, `logo-dark.png`, `logo-legacy.png`, `favicon.png`, `footer-bg.jpg`, `ihsan.png` | 1, 4, 5 |

## End-to-end verification checklist

- [ ] `npm install` clean
- [ ] `npm run lint --workspace client` → 0 warnings
- [ ] `npm run test --workspace client` → all green
- [ ] `npm run dev` → manual smoke pass on `/`, `/services`, `/team`, `/contact`, `/passport`
- [ ] Lighthouse: contrast AA on all hero/footer text
- [ ] Mobile (<768px): footer columns stack; navbar hamburger works; hero headline wraps cleanly
- [ ] No reference to `maltonif@gmail.com` anywhere in `client/`
- [ ] Two themes are visibly distinct: advisory (charcoal/navy + cyan/gold) vs passport (Solana navy + green→purple gradient)
- [ ] Footer attribution line present and legible
- [ ] Ihsan visible on `/team` without timeline; flipping `showTimeline: true` reveals his career

## Known follow-ups (out of scope for this epic)

- Real photo for Ihsan when available (replace `/ihsan.png` placeholder).
- Decision on flipping `Ihsan.showTimeline = true` once content review confirms it strengthens (not dilutes) the battery-advisory pitch.
- Final Unsplash photo URL chosen for `footer-bg.jpg` (candidate list to be reviewed during Phase 4 implementation).
