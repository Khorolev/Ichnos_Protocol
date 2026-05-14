# Design Refinement Epic — FEV-ready advisory + product split

> Comprehensive refinement of the Ichnos Protocol website following the first design epic (`docs/newDesignEpic.md`). The first pass landed structurally — themes scoped, `/passport` carved out, team page restructured — but the **content, hierarchy, copy, palette, and overall positioning** still need rework to be ready for the primary commercial goal: **landing subcontracting work from Dinsun Ju at FEV Asia**.
>
> This document is comprehensive on purpose. It is the source of truth for the second iteration. Traycer should plan the phasing (≤3 files per phase per `CLAUDE.md` §17.23); content, copy, palette values, ordering, and verification criteria are all locked here.

---

## 1. Strategic context

The website serves two distinct value propositions:

1. **Battery Advisory** — the near-term commercial engine. Audience: decision-makers at OEMs, Tier-1 suppliers, recyclers, and engineering services firms (primary target: **Dinsun Ju at FEV Asia**). They buy individual experts for bounded scopes: compliance dossiers, safety reviews, certification coordination, mechanical development, project management for cross-functional homologation.
2. **Battery Passport** (Solana-based platform) — the long-term product play, marketed only on `/passport`. Different audience (regulators, OEMs as data publishers, recyclers as consumers, Web3 capital), different sales cycle, different visual language.

**The website's job is to land #1 fast and signal #2 credibly as a moat.**

The **battery is the trunk, the passport is one branch**. Across the entire site — except on `/passport` itself — battery domain expertise (systems, safety, mechanical, remanufacturing) leads; passport is one of multiple offerings, not a parallel pillar.

**Solana and Web3 framing appear only on `/passport`**, never on advisory surfaces.

---

## 2. Design principles

1. **Two themes, one identity.**
   - **Advisory pages** (`/`, `/services`, `/team`, `/contact`): **light theme** — off-white base, near-black text, cyan + warm-amber accents.
   - **Passport page** (`/passport`): **dark theme retained** (Solana navy + green→purple gradient — kept as-is from prior epic).
   - **Footer is dark on every page** — bridges the two themes, anchors the brand, hosts the battery-internals background photo.

2. **Battery-first language everywhere except `/passport`.** "Battery" appears in the hero, services menu, bios, and section headings. "Battery Passport" appears as one of six service cards and as a teaser section. "Solana" is invisible outside `/passport`.

3. **Practitioner-led voice.** Copy is direct, specific, operational. No abstract "consultancy services" framing. The LinkedIn voice ("I help OEMs, Tier-1 suppliers, and recyclers implement battery passports that work in production — not just on paper") is the reference tone.

4. **No availability claims.** Do not state "1–3 days per week," "multi-month engagements," or any time-based commitment claims anywhere on the site.

5. **Reuse existing atoms / molecules.** Theme switch is a CSS-token swap, not a component refactor. Existing `Logo`, `Button`, `Icon`, `Card`, `NavItem`, etc. work for both themes via the `.theme-advisory` / `.theme-passport` cascade.

6. **Bio truthfulness.** Ihsan's bio must accurately reflect his background (mathematics, AI integration, quantitative finance, chemical-industry notified-body coordination). No fabricated battery-industry credentials. He is a math/AI/process co-founder for the digital product, not a battery domain expert.

7. **Atomic Design + `CLAUDE.md` conventions hold.** ≤120 lines per file, ≤60 JSX lines per component, ≤20 lines per function, default-export components, react-bootstrap primitives, no inline styles, RTK Query for any data.

---

## 3. Information architecture (the four sections)

The landing page (`/`) is the structural anchor. Four sections, each with deep sub-pages where appropriate:

| Section on `/` | Sub-page | Navbar entry |
|---|---|---|
| **Company** (Why Ichnos snapshot) | `/team` (full Company / Team / Vision) | **Company** |
| **Services** (6 cards) | `/services` (deep service descriptions) | **Services** |
| **Battery Passport** (teaser, 1 paragraph + small dark-themed preview) | `/passport` (full product showcase, dark theme) | **Battery Passport** |
| **Contact** (embedded chatbot + email + LinkedIn + Calendly + address) | `/contact` (aggregator destination for lazy users — same content rendered as a full page) | **Contact** |

**Navbar order**: Company · Services · Battery Passport · Contact.

**"Contact" navbar behavior**:
- From `/`: scrolls to the homepage Contact section (smooth scroll, anchor `#contact`).
- From any other page: navigates to `/contact` (the aggregator page).
- Implementation via the existing `useScrollToSection` hook, which already handles route-aware fallback.

`/contact` is **retained**, not removed. It aggregates and condenses every touch point (chatbot embed + email + LinkedIn company + LinkedIn founder + Calendly + KL address + UEN). Repetition with the homepage Contact section is intentional.

---

## 4. Hero (landing page)

**Eyebrow** (small caps, muted secondary text, sits above headline):
```
FROM REGULATORY COMPLIANCE TO REAL-WORLD CIRCULARITY
```

**Headline** (display, Fraunces serif, large, three statements on separate visual lines or with periods):
```
Engineering. Compliance. Circularity.
```

**Subhead** (Inter, regular weight, muted):
```
Battery systems engineering, safety, mechanical development, and remanufacturing — practitioner-led advisory for OEMs, Tier-1 suppliers, and recyclers across Europe and APAC.
```

**CTA**:
- Single primary button: `Explore Our Services` → `/services` (or anchor-scroll to `#services` section on `/`)
- Drop the previous secondary CTA.

**Background**: subtle battery-assembly-line photo at **5–10% opacity** behind the off-white hero. The committed asset is `client/public/bg-advisory.jpg` — licensed iStockPhoto stock (no attribution required), showing an EV battery pack on an assembly line with cylindrical cells and a robotic arm in the background. Footer photo separate — see §10 and §12.

---

## 5. Services — six cards, locked order, locked copy

Used in two places: the homepage `ServicesSnapshot` organism (compact card grid with 6 cards) and the `/services` page (full descriptions). Both render from the same `services.js` constants.

Order is locked. Do not rearrange.

### Card 1 — Battery Systems & Safety Engineering

- **Icon**: `bi-shield-check`
- **Title**: `Battery Systems & Safety Engineering`
- **Tagline (compact card)**: `System architecture, requirement and test management, and full FMEA discipline.`
- **Full description (`/services` page)**:
  > System architecture, requirement and test management, and full FMEA discipline — **S-FMEA, D-FMEA, P-FMEA** — across cell, module, and pack levels. Test planning, traceability, and design-review support for battery development programs that need rigorous engineering process from concept to SOP.

### Card 2 — Battery Mechanical Development

- **Icon**: `bi-tools`
- **Title**: `Battery Mechanical Development`
- **Tagline**: `Pack architecture, cell housing, thermal hardware, and design-for-manufacture.`
- **Full description**:
  > Pack and module mechanical design, cell housing, thermal hardware integration, and design-for-manufacture. Drawing on a doctorate in Production Engineering of E-Mobility Components and patents on battery modules and aluminium cell housings.

### Card 3 — Technical Lead — Battery Systems

- **Icon**: `bi-person-workspace`
- **Title**: `Technical Lead — Battery Systems`
- **Tagline**: `Embedded technical leadership for battery systems development programs.`
- **Full description**:
  > Embedded technical leadership for battery systems development programs. Senior battery expertise on demand for early-stage teams or in-house programs that need experienced direction without a full-time hire.

(Note: do **not** add days/weeks/months phrasing — see Principle 4.)

### Card 4 — EU–APAC Battery Compliance Bridge

- **Icon**: `bi-globe-asia-australia`
- **Title**: `EU–APAC Battery Compliance Bridge`
- **Tagline**: `Translating European battery regulation into APAC supply-chain reality — and vice versa.`
- **Full description**:
  > Translating European battery regulation into APAC (including ASEAN) supply-chain reality — and vice versa. Coverage includes EU 2023/1542, Malaysian MS 2818, regional certification frameworks, and supplier alignment for OEMs operating across both regions. Practitioner-grade understanding of where regulatory text meets the factory floor.

### Card 5 — Battery Remanufacturing, Recycling & Circular Economy

- **Icon**: `bi-arrow-repeat`
- **Title**: `Battery Remanufacturing, Recycling & Circular Economy`
- **Tagline**: `Second-life pathways, design for remanufacturing, design for recycling, design for cost.`
- **Full description**:
  > Second-life pathways, **design for remanufacturing**, **design for recycling**, and **design for cost**. PhD-level expertise in circular-economy battery systems — backed by the 3rd-place RWTH Innovation Award and four peer-reviewed publications on remanufacturing, recycling, and cell housing design. Founder lectured on battery recycling at the RWTH Aachen PEM Chair.

### Card 6 — Battery Passport Implementation

- **Icon**: `bi-shield-fill-check` (fallback if `bi-passport` is not available in the icon set version in use)
- **Title**: `Battery Passport Implementation`
- **Tagline**: `EU 2023/1542 and MS 2818 readiness audits, gap analyses, and end-to-end implementation.`
- **Full description**:
  > EU 2023/1542 and Malaysian MS 2818 readiness audits, gap analyses, and end-to-end implementation: data model design, supplier data collection workflows, and carbon-footprint pipelines. Tied directly to the digital Battery Passport platform Ichnos Protocol is building — see **/passport**.

**Cross-link**: Card 6's description ends with a `<Link to="/passport">` chip or "Learn more →" arrow to the passport page.

---

## 6. Team page — bio rewrites + recognition + corrected timeline

### Francesco — full bio (replace existing `bio` array)

```
[
  "Dr. Francesco Maltoni is the Founder of Ichnos Protocol. He helps OEMs, Tier-1 suppliers, and recyclers build battery systems and battery passports that work in production — not just on paper.",
  "Francesco's expertise spans battery system architecture and safety, mechanical development, remanufacturing, and EU/APAC compliance. Since 2022, his focus has extended into the operational reality of EU Regulation 2023/1542 and DIN DKE SPEC 99100: what the data actually has to look like, where it comes from in the supply chain, and how to move it between systems that were never designed to talk to each other. At FEV Europe, he led a battery passport pilot project as Lead Expert — Battery Systems, and directed the internal software work that turned real-time battery data into passport-compliant output. He has also contributed to Horizon EU grant proposals on adjacent topics.",
  "His doctorate (Dr.-Ing., RWTH Aachen PEM) was on automotive battery systems for the circular economy, with a focus on remanufacturing — recognised with the 3rd-place RWTH Innovation Award. During his doctoral years he also lectured on battery recycling at the RWTH Aachen Chair of Production Engineering of E-Mobility Components (PEM). Before the doctorate, thirteen years in engineering roles across Ducati, Technogym, and FEV — spanning engine design, motorcycle design, electrification, and vehicle battery design.",
  "In 2026 he founded Ichnos Protocol (Singapore) as a battery advisory practice that also builds a digital Battery Passport platform aligned with EU Regulation 2023/1542 and Malaysian MS 2818."
]
```

### Francesco — skills chips (ordered, replace existing `coreCompetencies` for Francesco)

```
[
  "Battery Systems & Safety (FMEA · requirements · test management)",
  "Mechanical Development",
  "Remanufacturing & Circular Economy",
  "EU–APAC Compliance (incl. ASEAN)",
  "Battery Passport (EU 2023/1542 · DIN DKE SPEC 99100 · MS 2818)",
  "Project Management & Agile (Scrum, PSM I)",
  "AI Integration",
  "Languages: IT · DE · EN"
]
```

### Francesco — corrected 2025 timeline entry

Replace the existing 2025 entry (currently incorrectly labelled "Web developer" or similar) with:

```
{
  id: "sigma-school-upskill",
  year: "2025",
  title: "Self-directed upskilling in software engineering and AI integration",
  organization: "Sigma School — 12-Week Software Development Bootcamp",
  description: "Intensive bootcamp in web development and AI integration, undertaken in preparation for founding Ichnos Protocol and leading its digital workstreams."
}
```

Insert chronologically between his 2022–2025 FEV Lead Expert entry and the 2026 Ichnos Protocol founding entry. Do not remove any other existing timeline entries.

### Francesco — new Recognition subsection (render on the team page below skills chips)

A new organism `RecognitionBlock` (or extend `FounderProfile`) renders this as a quiet, low-key block — small headings, list items, not a hero element. Five subsections:

```
Award
- RWTH Innovation Award, 3rd place — circular-economy battery systems

Patents
- Battery module and method for producing same
- Battery with an interface for transmitting a control command that reconfigures the battery for a new purpose or recycling
- Oil multiple pump and motor vehicle with such a multiple oil pump
- Inlet device for an internal combustion engine and internal combustion engine

Publications
- Cell Tab Cooling System for Battery Life Extension
- Design of automotive battery systems for the circular economy
- Recycling von Lithium-Ionen-Batterien
- Battery Pack Remanufacturing Process up to Cell Level with Sorting and Repurposing of Battery Cells
- Benefits of aluminium cell housings for cylindrical lithium-ion batteries

Certification
- Professional Scrum Master™ I (PSM I) — Scrum methodology (not a project-management credential)

Teaching
- Battery recycling lessons at RWTH Aachen Chair of Production Engineering of E-Mobility Components (PEM), during doctoral period (2017–2021)
```

### Ihsan — full bio rewrite (replace existing `bio` array)

```
[
  "Ihsan Ahmad is Co-Founder of Ichnos Protocol, bringing methodical excellence to the company's digital strategy and product development.",
  "A mathematician by training (M.Sc. Wirtschaftsmathematik, Karlsruhe Institute of Technology), Ihsan combines analytical rigour with hands-on execution across AI integration, quantitative financial modelling, and coordination of testing with notified bodies in the chemical industry.",
  "At Ichnos Protocol, Ihsan leads the digital and analytical workstreams supporting the Battery Passport product — applying his AI-integration background and process discipline to the data, intelligence, and certification layers of the platform."
]
```

### Ihsan — skills chips (replace any existing competencies for Ihsan)

```
[
  "AI Integration",
  "Quantitative Modelling",
  "Notified-Body Coordination",
  "Methodical Excellence"
]
```

### Ihsan — timeline

`showTimeline: false` — retain. Do **not** render his career timeline on the team page. The data structure stays in `teamTimelines.js` (or wherever Ihsan's hidden timeline currently lives) so a future flag flip is one line; just do not render.

### Ihsan — title

Keep as `Co-Founder`. Do not write `Technomathematician`. He is a mathematician.

### `TEAM_PAGE_HEADER`

Stays as `"Meet the Team"` (already correct from prior epic).

---

## 7. Landing page sections (in render order)

The `LandingPage.jsx` organism composes these in order, each as an anchorable section:

| Order | Organism | Section anchor | Theme background |
|---|---|---|---|
| 1 | `Hero` (advisory variant) | n/a (top) | off-white, optional battery-assembly bg at 5–10% |
| 2 | `ServicesSnapshot` (6 cards in compact grid, with "See full services →" link to `/services`) | `#services` | pure white |
| 3 | `CompanySnapshot` (a tight "Why Ichnos" block: 2–3 sentences positioning + small grid of 3 differentiators: "Practitioner-led", "EU + APAC", "PhD-level circular-economy depth"; with "Meet the team →" link to `/team`) | `#company` | light grey (`--color-bg-alt`) for rhythm |
| 4 | `PassportTeaser` (one paragraph + small dark-themed preview card + "Explore the Battery Passport →" to `/passport`) | `#passport` | pure white |
| 5 | `ContactSnapshot` (embedded chatbot prompt + email + LinkedIn (company and founder) + Calendly + KL address; with "Open the contact page →" link to `/contact` for lazy users) | `#contact` | light grey |
| 6 | `Footer` (dark theme, battery-internals bg) | n/a | dark |

The `SolutionOverview`, `ProblemStatement`, `WhyIchnos`, and other organisms that exist from earlier iterations and don't fit into the four-section model should be **dropped from the landing page composition** (do not delete the files — they may be referenced from other pages — but stop rendering them from `LandingPage.jsx`).

If `ServicesSnapshot` doesn't currently exist as an organism, **create it** by composing the existing `ServiceCard` molecule six times with the data from `services.js` (new locked copy in §5).

`PassportTeaser` is a new organism — small composition with a one-paragraph teaser plus a dark-themed preview card. Copy:

> **Heading**: Battery Passport
>
> **Body**: Beyond advisory, Ichnos Protocol is building a digital Battery Passport platform aligned with EU Regulation 2023/1542 and Malaysian MS 2818. Compliant data foundations for OEMs exporting between Europe and ASEAN — designed for two regulatory homes from day one.
>
> **CTA**: Explore the Battery Passport →

`CompanySnapshot` is also new. Three differentiators (each a small card with icon + label):

| Icon | Label |
|---|---|
| `bi-mortarboard` | PhD-level circular-economy depth |
| `bi-globe-asia-australia` | EU regulation, APAC supply chains |
| `bi-tools` | Practitioner-led |

Followed by "Meet the team →" linking to `/team`.

---

## 8. Contact section — embedded chatbot + condensed touchpoints

Both on the homepage `#contact` section AND on the `/contact` aggregator page. Same content; on `/contact` slightly expanded with more body text and an "About contacting us" intro paragraph.

Elements (in order, on both surfaces):

1. **Heading**: `Get in touch`
2. **Subhead** (one sentence): `Tell us about your project — chat with us directly, book a call, or send a message.`
3. **Primary**: embedded chatbot widget (`ChatModal`-derived inline component, or the existing chatbot widget made always-visible in this section)
4. **Secondary contact methods row** (as a horizontal group of links, each with an icon):
   - 📧 `francesco@ichnos-protocol.com` → `mailto:francesco@ichnos-protocol.com`
   - 💼 LinkedIn (Company) → `https://www.linkedin.com/company/ichnos-protocol/`
   - 💼 LinkedIn (Founder) → `https://www.linkedin.com/in/maltonif/`
   - 📅 Book a Call → Calendly URL from `companyInfo.js`
5. **Address line** (small, muted): `Ichnos Protocol Pte. Ltd. — 160 Robinson Road, #14-04 Singapore Business Federation Centre, Singapore 068914 · UEN 202606052196`

The persistent floating chatbot widget (bottom-right, on every page) stays as-is. The Contact-section embed is a separate, always-visible instance for the homepage and `/contact`.

**Important**: do NOT make `/contact` land on a bare chatbot page. The chatbot is **one of multiple** touchpoints on that page, not the only one.

---

## 9. Navbar + navigation

### Navbar entries (in order)

```
Company · Services · Battery Passport · Contact
```

- "Company" → `/team` (the full company page) on click. On the homepage, smooth-scrolls to `#company` section.
- "Services" → `/services` on click. On the homepage, smooth-scrolls to `#services` section.
- "Battery Passport" → `/passport` (always navigates; this is a separate themed page, not an anchor).
- "Contact" → `#contact` anchor on homepage, OR `/contact` page on any other page.

### Logo behavior (in navbar)

- Advisory pages (light theme): use the **dark** logo (`/logo-dark.png` — the `Ttransparent_black.png` lockup).
- Passport page (dark theme): use the **white** logo (`/logo.png`).
- Footer (always dark): use the **white** logo.

The `Logo` atom should accept a `theme` prop (`"light" | "dark"`) and choose the correct source, or it can read from the active theme context. Implementation choice is Traycer's.

---

## 10. Theme system — light advisory, dark passport, dark footer

### CSS token redefinition (in `client/src/index.css`)

Update `:root` and theme-scoped blocks to:

```css
:root {
  /* Typography, spacing, transitions, z-index — unchanged from existing */
}

/* ───── Advisory theme — LIGHT ───── */
.theme-advisory, body {
  --color-bg-base: #FAFBFC;          /* off-white, page background */
  --color-bg-alt: #F0F3F7;           /* light grey, alternating sections */
  --color-surface: #FFFFFF;          /* pure white, cards */
  --color-surface-elevated: #FFFFFF; /* card surfaces */
  --color-text-primary: #0F1419;     /* near-black, primary text */
  --color-text-secondary: #5B6B85;   /* medium-grey, secondary text */
  --color-border: rgba(15, 20, 25, 0.08);
  --color-shadow: rgba(15, 20, 25, 0.06);
  --color-accent-primary: #00A89A;   /* deeper cyan for contrast on white */
  --color-accent-cyan: #00A89A;
  --color-accent-warm: #A87E1F;      /* deeper amber for contrast */
  /* Gradient tokens deliberately NOT set on advisory — drop the Solana gradient */
}

/* ───── Passport theme — DARK (unchanged from prior epic) ───── */
.theme-passport {
  --color-bg-base: #0A1628;
  --color-bg-alt: #1A2744;
  --color-surface: #1A2744;
  --color-surface-elevated: #232732;
  --color-text-primary: #E8ECF1;
  --color-text-secondary: #8B9DC3;
  --color-border: rgba(139, 157, 195, 0.15);
  --color-shadow: rgba(0, 0, 0, 0.3);
  --color-accent-primary: #1E90FF;
  --color-accent-cyan: #00D1C1;
  --color-accent-warm: #C8A24E;
  --color-gradient-start: #14F195;
  --color-gradient-end: #9945FF;
}

/* ───── Footer (always dark) ───── */
.footer-dark {
  --color-bg-base: #0F1419;
  --color-bg-alt: #1A2030;
  --color-surface: #1A2030;
  --color-text-primary: #E8ECF1;
  --color-text-secondary: #9AA5B8;
  --color-border: rgba(232, 236, 241, 0.08);
}
```

Wrap the `Footer` organism in `<footer className="footer-dark">…</footer>` so its content automatically uses the dark palette regardless of the parent page's theme.

### Section-rhythm utility (light theme only)

Two sibling utility classes used to alternate section backgrounds on advisory landing:

```css
.section-rhythm-primary {
  background-color: var(--color-bg-base);    /* off-white */
}
.section-rhythm-alt {
  background-color: var(--color-bg-alt);     /* light grey */
}
```

Applied to each landing section per the table in §7.

### Card style (light theme)

Replace existing `1px solid border` card styling with elevated surfaces:

```css
.card-elevated {
  background-color: var(--color-surface);
  box-shadow: 0 2px 12px var(--color-shadow);
  border: none;
  border-radius: 12px;
  transition: var(--transition-base);
}

.card-elevated:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px var(--color-shadow);
}
```

Applied to `ServiceCard`, `CompanySnapshot` cards, and other surface-elevated elements.

### Hero gradient handling

The `.gradient-text` class **stays defined globally** but is **only applied on `/passport`** going forward. On advisory pages, headlines render in `--color-text-primary` (near-black). The hero "Engineering. Compliance. Circularity." headline has **no gradient** on the advisory landing.

---

## 11. Typography

### Add Fraunces for display headlines

Variable serif font from Google Fonts. Free, modern, with a distinct personality that signals "considered advisory firm" without being old-school.

**`client/index.html` — add font link in `<head>`**:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap" rel="stylesheet">
```

(Existing Inter `<link>` stays. Add Fraunces alongside.)

### Token updates in `index.css`

```css
:root {
  --font-sans: 'Inter', 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-display: 'Fraunces', 'Georgia', 'Times New Roman', serif;
  --font-mono: 'JetBrains Mono', monospace;
  /* ... rest unchanged */
}
```

### Apply display font to headlines

```css
h1.page-title,
.hero-headline,
.section-display-heading {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
}
```

Hero headline (`Engineering. Compliance. Circularity.`) gets `.hero-headline` class. Major section headers across `/services`, `/team`, `/contact` get `.section-display-heading`. Body, buttons, navigation, cards stay on Inter (no change).

Passport page (`/passport`) — keep all-Inter as-is (Fraunces clashes with the tech-product feel). The `theme-passport` block can override:

```css
.theme-passport h1.page-title,
.theme-passport .hero-headline,
.theme-passport .section-display-heading {
  font-family: var(--font-sans);
}
```

---

## 12. Imagery

Two image assets are committed under `client/public/`. **Both are licensed stock photography (iStockPhoto). No attribution is required or to be displayed.**

### `client/public/bg-advisory.jpg`

- **Subject**: EV battery pack on an assembly line, cylindrical cells visible, robotic arm in background, clean industrial environment.
- **Status**: already committed.
- **Treatment in CSS**: low-opacity overlay behind the advisory hero so the headline remains the focal point.
- **Implementation**:
  ```css
  .hero-section--advisory {
    background:
      linear-gradient(to bottom, rgba(250, 251, 252, 0.92), rgba(250, 251, 252, 0.96)),
      url('/bg-advisory.jpg') center/cover no-repeat;
  }
  ```

### `client/public/bg-footer.jpg`

- **Subject**: close-up of an open battery module showing prismatic cells, busbars, and BMS connections — exactly the engineering-detail shot the brief asked for.
- **Status**: already committed.
- **Treatment**: moderate-opacity overlay on the dark footer so text remains AA-contrast-readable.
- **Implementation**:
  ```css
  .footer-dark {
    background:
      linear-gradient(rgba(15, 20, 25, 0.85), rgba(15, 20, 25, 0.92)),
      url('/bg-footer.jpg') center/cover no-repeat;
  }
  ```

### Footer copyright line

Small line in the footer, low contrast, 11px. **No photography attribution** — the images are licensed stock and require no credit:

```
© 2026 Ichnos Protocol Pte. Ltd. — All rights reserved.
```

### Optional optimisation (out of scope for the imagery phase but worth noting)

`bg-footer.jpg` is currently ~6.6 MB and `bg-advisory.jpg` ~4 MB. For production these should be compressed (e.g., `cwebp -q 80` or `sharp` pipeline) to ≤500 KB each without visible quality loss. This is a follow-up performance ticket, not a blocker for the design refinement epic.

---

## 13. Passport page (`/passport`) refinements

The `/passport` page remains the only Solana-themed page. It must be **self-contained** and tell a **complete, credible product story**.

### Add Malaysian MS 2818 / MARI framing

In the `PassportHero` (or equivalent organism) intro paragraph, add the dual-standard positioning. Locked copy:

> Designed for two regulatory homes: built natively for **EU Regulation 2023/1542** and **Malaysian Standard MS 2818** (published by MARI — the Malaysian Automotive, Robotics & IoT Institute). Manufacturers exporting between Europe and ASEAN can satisfy both regimes from a single data foundation.

This goes prominently in the hero or first content block of `/passport`.

### Solana / Web3 framing

May appear on this page. Position as the technical architecture choice (transparency, immutability, low transaction cost for high-volume passport events). Keep tasteful — not crypto-marketing. Suggested phrase:

> Built on Solana for verifiable, immutable passport data with the throughput and cost profile needed for industrial-scale deployment.

### Content already on the page (from prior epic)

`FeatureMaturityMatrix` and `TechnologyRoadmap` stay. Add at least one new content block that summarizes the **value proposition for OEMs** and **value proposition for recyclers** so the page has a clear "who is this for?" beat.

### Orphaned content recovery

The first epic carved `/passport` out of `/services`. Some content from the old landing page narrative section ("what is the Battery Passport, why does it matter") was dropped without being relocated. **Find that orphaned narrative content in git history (recent commits on `feat/design-epic` or `main`) and relocate it to `/passport` as a "Why Battery Passport" or "The Problem We're Solving" content block.** If the content can't be recovered cleanly, draft it fresh — short version:

> Today, battery data lives in scattered spreadsheets, supplier portals, and proprietary databases. EU Regulation 2023/1542 demands it be available, structured, and verifiable across the entire battery lifecycle. Battery Passport platforms bridge the gap between that regulatory expectation and operational reality. We're building one.

---

## 14. Files modified — checklist

This is non-exhaustive but covers the major surfaces Traycer will touch. Traycer should add anything missing during its planning phase.

### Constants
- `client/src/constants/services.js` — full rewrite for 6 cards (§5)
- `client/src/constants/teamContent.js` — bios + skills + 2025 timeline entry (§6)
- `client/src/constants/teamTimelines.js` — Ihsan stays hidden, Francesco's 2025 entry added
- `client/src/constants/landingContent.js` — new hero copy (eyebrow + headline + subhead + single CTA) (§4)
- `client/src/constants/companyInfo.js` — verify `CONTACT_SECTION_CONTENT` matches the new Contact section copy (§8). If absent, add.
- `client/src/constants/navigation.js` — 4 nav entries in locked order (§9)
- `client/src/constants/passportContent.js` — MS 2818 / MARI dual-standard copy (§13)

### Organisms (modify or create)
- `client/src/components/organisms/Hero.jsx` — eyebrow + headline + subhead + single CTA; light theme background; battery-assembly bg
- `client/src/components/organisms/ServicesSnapshot.jsx` — **new** (or revived); compact 6-card grid for homepage
- `client/src/components/organisms/ServicesList.jsx` — full descriptions for `/services` page
- `client/src/components/organisms/CompanySnapshot.jsx` — **new**; 3 differentiator cards + "Meet the team →" link
- `client/src/components/organisms/PassportTeaser.jsx` — **new**; one paragraph + small dark preview + CTA
- `client/src/components/organisms/ContactSection.jsx` — embedded chatbot + 4 contact links + address (§8)
- `client/src/components/organisms/ContactSnapshot.jsx` — **new** if needed; or extend `ContactSection` to be reused
- `client/src/components/organisms/Footer.jsx` — wrap in `footer-dark` class; consume `bg-footer.jpg` for the background photo; verify content keeps the 4-column layout from the prior epic; remove any prior "Photography:" attribution line (images are licensed iStockPhoto, no attribution required)
- `client/src/components/organisms/FounderProfile.jsx` — read bio + skills + timeline from updated `teamContent.js`; render Recognition block via new sub-component if needed
- `client/src/components/organisms/RecognitionBlock.jsx` — **new**; renders award + patents + publications + certification + teaching list (§6)
- `client/src/components/organisms/CareerTimeline.jsx` — render Francesco's full timeline including the new 2025 Sigma School entry
- `client/src/components/organisms/PassportHero.jsx` — add MS 2818 / MARI dual-standard paragraph

### Pages
- `client/src/components/pages/LandingPage.jsx` — recompose to the 6-section order in §7
- `client/src/components/pages/ServicesPage.jsx` — render full descriptions from `services.js`
- `client/src/components/pages/PassportPage.jsx` — verify content order, ensure self-contained narrative, MS 2818 framing
- `client/src/components/pages/ContactPage.jsx` — render the same Contact content as the homepage section, plus an "About contacting us" intro paragraph
- `client/src/components/pages/TeamPage.jsx` — render `FounderProfile` for each team member; recognition block follows skills

### Atoms / molecules
- `client/src/components/atoms/Logo.jsx` — accept `theme` prop or read context; switch `src` between `/logo.png` (white, for dark surfaces) and `/logo-dark.png` (dark, for light surfaces)

### Templates
- `client/src/components/templates/AdvisoryThemeLayout.jsx` — apply light-theme tokens via `.theme-advisory` class on its root
- `client/src/components/templates/PassportThemeLayout.jsx` — apply dark-theme tokens via `.theme-passport` class
- `client/src/components/templates/PublicLayout.jsx` — render the dark footer regardless of inner theme

### Styles
- `client/src/index.css` — full theme-token refactor per §10; new section-rhythm utilities; new card-elevated style; new hero-section--advisory; new footer-dark; Fraunces typography wiring per §11

### HTML
- `client/index.html` — add Fraunces `<link>` tags per §11

### Public assets
- `client/public/bg-advisory.jpg` — **committed** (licensed iStockPhoto, battery assembly line)
- `client/public/bg-footer.jpg` — **committed** (licensed iStockPhoto, open battery module showing cells, busbars, cabling)

---

## 15. Verification criteria

After each phase Traycer ships, the following must hold:

### Visual / brand
- [ ] Advisory pages (`/`, `/services`, `/team`, `/contact`) render in light theme: off-white background, near-black headlines, no Solana gradient anywhere
- [ ] Passport page (`/passport`) renders in dark theme: Solana navy + green→purple gradient, retained from prior epic
- [ ] Footer is dark on every page (advisory and passport), with the battery-internals background photo
- [ ] Navbar logo is the dark lockup on advisory pages, white lockup on passport page and inside the dark footer
- [ ] Hero headline is "Engineering. Compliance. Circularity." in Fraunces serif
- [ ] Hero subhead reads exactly as locked in §4

### Content correctness
- [ ] Services section on the homepage renders 6 cards in the locked order from §5
- [ ] Each service card title and tagline matches the locked copy
- [ ] `/services` page renders the full descriptions from the same constant
- [ ] Francesco's bio matches the four-paragraph locked text in §6
- [ ] Francesco's 2025 timeline entry is the Sigma School entry, not "Web developer"
- [ ] Francesco's skills chips render in locked order, including "Project Management & Agile (Scrum, PSM I)" as a single chip
- [ ] Recognition block renders below Francesco's skills, with award + patents + publications + certification + teaching
- [ ] Ihsan's bio matches the three-paragraph locked text in §6 (mathematician, AI integration, quantitative modelling, chemical-industry notified bodies, methodical excellence)
- [ ] Ihsan's title is "Co-Founder" — never "Technomathematician"
- [ ] Ihsan's timeline is not visible on the team page (`showTimeline: false` is honored)
- [ ] Contact section on `/` and `/contact` lists email · LinkedIn (Company) · LinkedIn (Founder) · Calendly · address
- [ ] Inquiries email is `francesco@ichnos-protocol.com` everywhere; zero references to `maltonif@gmail.com` in the client codebase

### IA / navigation
- [ ] Navbar has exactly four entries in order: Company · Services · Battery Passport · Contact
- [ ] Clicking "Contact" from the homepage smooth-scrolls to `#contact`; from any other page navigates to `/contact`
- [ ] Each landing section is anchorable (`#company`, `#services`, `#passport`, `#contact`)
- [ ] Passport page is reachable from: navbar, Service Card 6 link, PassportTeaser CTA on landing
- [ ] No `/services` content includes a `FeatureMaturityMatrix` or `TechnologyRoadmap` (those live on `/passport`)

### Theme system
- [ ] Inspecting any advisory page in DevTools shows `--color-bg-base: #FAFBFC` resolved on `<body>`
- [ ] Inspecting `/passport` shows `--color-bg-base: #0A1628` resolved
- [ ] The footer dark theme is scoped to `.footer-dark` and works regardless of parent theme
- [ ] No advisory headline uses the `gradient-text` class

### Typography
- [ ] Hero headline renders in Fraunces (`font-family: 'Fraunces'` resolved)
- [ ] Body text renders in Inter
- [ ] `/passport` headlines stay in Inter (no Fraunces override)

### Imagery
- [ ] `bg-advisory.jpg` exists in `client/public/`, used at low opacity behind the advisory hero (EV battery on assembly line)
- [ ] `bg-footer.jpg` exists, shows the open battery module with cells/busbars/cabling, used at moderate opacity behind the dark footer
- [ ] Footer copyright line contains **no** "Photography:" credit (images are licensed iStockPhoto, attribution not required)

### Tests
- [ ] `npm run lint --workspace client` → 0 warnings
- [ ] `npm run test --workspace client` → all green (existing tests updated to reflect new copy, new ordering, new components)
- [ ] E2E (`e2e/`) — confirm critical flows still pass on the post-merge preview after redeploy

### Solana / passport containment
- [ ] No mention of Solana, blockchain, Web3, gradient text, or product roadmap on any advisory page
- [ ] `/passport` is the only page that mentions Solana
- [ ] `/passport` retains the dark Solana theme exactly as the prior epic delivered, plus the new MS 2818 / MARI framing

### Accessibility
- [ ] Lighthouse contrast check: all body and headline text on the light theme passes AA (≥4.5:1 for body, ≥3:1 for large headlines)
- [ ] Footer text on the dark battery-internals overlay passes AA
- [ ] Mobile (<768px): all landing sections stack correctly, navbar collapses to hamburger, footer columns stack

---

## 16. Suggested phasing for Traycer

Not prescriptive — Traycer plans the actual phases per its own `≤3 files per phase` rule. But a sensible grouping:

| Suggested phase | Focus | File budget |
|---|---|---|
| 1 | Token refactor: light advisory theme + footer-dark + new hero classes in `index.css`; add Fraunces in `index.html` | 2 files |
| 2 | Asset wiring: reference `bg-advisory.jpg` (hero background) and `bg-footer.jpg` (dark-footer background) in CSS; remove any prior `hero-bg.jpg` / `footer-bg.jpg` filename references; theme-aware `Logo` atom | 2–3 files |
| 3 | Hero rewrite: `landingContent.js` + `Hero.jsx` + `index.css` (hero-specific styles) | 3 files |
| 4 | Services constants rewrite: 6 cards locked copy in `services.js`; update `ServicesList.jsx` to consume; create `ServicesSnapshot.jsx` for homepage | 3 files |
| 5 | Landing page recomposition: `LandingPage.jsx` to render Hero → ServicesSnapshot → CompanySnapshot → PassportTeaser → ContactSection in order; create `CompanySnapshot.jsx` and `PassportTeaser.jsx` | 3 files |
| 6 | Contact section unification: `ContactSection.jsx` updated, `/contact` page updated to render same content + intro, navigation hook for anchor scrolling | 3 files |
| 7 | Team data: `teamContent.js` (Francesco + Ihsan bios, Francesco skills, Ihsan skills); `teamTimelines.js` (2025 Sigma School entry) | 2 files |
| 8 | Team render: `FounderProfile.jsx`, `CareerTimeline.jsx` to consume new data; new `RecognitionBlock.jsx` organism | 3 files |
| 9 | Navigation: `navigation.js` (4 entries) + `Navbar.jsx` (anchor-vs-page navigation logic for Contact) | 2 files |
| 10 | Passport page strengthening: `passportContent.js` + `PassportHero.jsx` for MS 2818 / MARI framing + relocate orphaned narrative | 3 files |
| 11 | Tests update: component tests for renamed/recomposed components, snapshot regenerations | 3–5 test files |
| 12 | Lint + verification pass; visual smoke; E2E on preview | n/a |

Each phase ends with a Conventional Commit (`feat(client): …`, `refactor(client): …`, `docs: …` as appropriate) per `CLAUDE.md` §15.

---

## 17. Out of scope (explicitly)

These are intentionally NOT included in this epic. Do not address them.

- Backend / server / API changes
- Database schema changes
- New Vercel integrations
- New CI/CD workflow changes
- Production deployment (the existing pipeline handles it — see `docs/deploymentMigrationValidation.md`)
- Chat / Grok API logic changes (chatbot widget rendering only)
- Real photo for Ihsan beyond the current portrait (already in place)
- Flipping `Ihsan.showTimeline = true`
- Translation / i18n (single English version remains)
- Pricing page
- Case studies / portfolio (future epic)
- Blog / news section

---

## 18. Execution policy (locked answers to common ambiguities)

These are the canonical resolutions for questions that have already been raised against this spec. Do not re-ask.

### 18.1 Supersession of prior tickets
This spec **supersedes** previously-completed tickets where they conflict. Conflicting prior outputs are replaced; non-conflicting prior outputs stay. Untouched surfaces (admin pages, auth modals, mobile nav overlay, cookie banner) are not refactored.

### 18.2 Navbar model — locked
Four top-level entries, route-aware behavior. **No Company dropdown.** If the current implementation has dropdown semantics for Company, collapse them: "Company" is a single link that goes to `/team` from non-home pages and smooth-scrolls to `#company` on `/`.

### 18.3 Embedded chatbot — required, with implementation pattern
The chatbot is **embedded inline** in the `#contact` section of `/` and on `/contact`. The persistent floating widget at bottom-right stays as the secondary always-available channel.

Implementation pattern (do this, do not invent alternatives):
1. Extract the chat body (messages list + input area + send logic) into a reusable molecule (`ChatPanel` or equivalent). Use the existing `ChatMessage` and `ChatInputArea` molecules; do not rewrite them.
2. Add a `mode="inline" | "modal"` prop to the chat-owning organism. Inline mode renders the panel directly into a page section with fixed height (~480px) and no overlay/backdrop. Modal mode preserves the current modal behavior for the floating widget.
3. Render `<ChatPanel mode="inline" />` as the primary element of `#contact` on `/` and the main content of `/contact`. Email · LinkedIn (company) · LinkedIn (founder) · Calendly · address render alongside as secondary touchpoints.
4. The floating widget at bottom-right keeps the modal trigger behavior.

This is non-negotiable — the chatbot is the primary lead-gen surface and cannot live behind a CTA.

### 18.4 Battery Passport in advisory services — required
Card 6 (Battery Passport Implementation) is a locked entry in the 6-card service model. Service ≠ product: passport implementation is a service Ichnos sells; the platform being built is a separate product on `/passport`. Both coexist.

### 18.5 Imagery assets — committed before implementation
`client/public/bg-advisory.jpg` and `client/public/bg-footer.jpg` are **already committed** as licensed iStockPhoto stock. No placeholder-safe fallback code is required, and no attribution line is to be added to the footer. If for some reason an asset becomes unavailable at implementation time, the phase blocks until it is restored — do not invent fallback logic.

### 18.6 Passport narrative recovery — history first, fallback allowed
Attempt to recover the dropped Battery Passport narrative content from recent git history (commits on `feat/design-epic` and `main`) first. If recovery is not clean (deleted text not present in any reachable commit, merge conflicts, or recovered text reads as out-of-voice for the current copy), fall back to the fresh short copy in §13. Do not block the phase on recovery.

### 18.7 Navbar active state — scrollspy on `/`, route-based elsewhere
On `/`, the active navbar entry tracks the user's scroll position relative to the four sections (`#company`, `#services`, `#passport`, `#contact`). On every other route, active state derives from the current pathname.

Implementation pattern:
- New hook `useActiveSection(sectionIds)` in `client/src/hooks/`.
- Wraps `IntersectionObserver` with threshold ≈ `0.5` (section is active when ≥50% of it intersects the viewport).
- Returns the current active section ID or `null`.
- The `Navbar` organism reads from `useActiveSection` **only when** `useLocation().pathname === "/"`. On other routes it falls back to pathname-derived active state.
- Battery Passport navbar entry: always route-based (never scrollspy-active on `/`, because Battery Passport on `/` is just a teaser; the real Battery Passport surface is `/passport`).

No active state when the page is at the very top (above the first section anchor) — the hook returns `null`, and no navbar entry is highlighted.

### 18.8 Inline chat behavior contract — three modes, two state policies
A single `ChatPanel` molecule drives all three chat surfaces with two props:

| Surface | `mode` | `persistState` | History? | Auth gating? | Pending-post-login send? |
|---|---|---|---|---|---|
| Floating widget (every page, bottom-right) | `"modal"` | `true` | yes | yes | yes |
| `/contact` page main element | `"inline"` | `true` | yes | yes | yes |
| Homepage `#contact` section | `"inline"` | `false` | **no — fresh state per visit** | yes (server-side requirement) | **no — does not write to or read from the modal's pending-send buffer** |

`ChatModal` becomes a thin wrapper around `<ChatPanel mode="modal" persistState={true} />`. All conversation state, history fetching, and pending-send buffer logic is gated on `persistState`.

The homepage embed treats every interaction as a new conversation. If the user later opens the floating widget or visits `/contact`, those surfaces show their own (persistent) state independently. This keeps the homepage feeling like a marketing surface, not a chat client.

### 18.9 Locked-copy enforcement — hybrid (constants for structured text, inline for short labels)
Long-form, structured, or repeated user-facing copy lives in `client/src/constants/`. Short, component-local labels can stay inline **provided a component test asserts the exact string via `getByText` or `getByRole`** so wording drift is caught by CI.

Categorisation:

| Lives in `client/src/constants/` (centralised) | Stays inline (with mandatory test assertion) |
|---|---|
| Hero eyebrow, headline, subhead | Button labels (e.g., "Learn more →", "Send") |
| Service card titles + taglines + full descriptions | Anchor-link labels (e.g., "Meet the team →") |
| Founder/co-founder bio paragraphs | Section anchor IDs (`#services`, etc.) |
| Skills chips text | Form placeholder text |
| Recognition block items (award, patents, publications, certification, teaching) | Loading / skeleton state strings |
| Contact section heading + subhead | Error message strings |
| Timeline entries (year + title + organization + description) | Modal "Close" / "Cancel" labels |
| Passport page hero + MS 2818 / MARI paragraph | Generic accessibility labels (`aria-label`) |
| Footer copyright line | Test IDs |

Existing constants files (`landingContent.js`, `services.js`, `teamContent.js`, `teamTimelines.js`, `passportContent.js`, `companyInfo.js`) are extended rather than splintered. Add a new constants file only when a category genuinely doesn't fit an existing one.

**Test assertion rule**: every inline string longer than three words must have a component test that asserts on the exact text. This is a code-review gate — PRs with un-asserted inline strings over the threshold are rejected.

---

## 19. PR review checklist (per-phase)

Each Traycer phase lands as its own PR. Use this checklist to review the PR before merging. **Skip any section that doesn't apply to the files touched in this PR** — the section headers tell you when each one is relevant.

### 19.A — Universal (every PR)

- [ ] `npm run lint --workspace client` passes with 0 warnings
- [ ] `npm run test --workspace client` passes; coverage not regressed
- [ ] Commit message follows Conventional Commits (`feat(client): …`, `refactor(client): …`, `docs: …`, etc.)
- [ ] No file in the diff exceeds 120 lines
- [ ] No React component has more than 60 lines of JSX in its `return`
- [ ] No function exceeds 20 lines
- [ ] No `.env`, no secrets, no API keys staged
- [ ] No `dangerouslySetInnerHTML` introduced
- [ ] No raw `fetch` / `axios` in components — all server calls go through RTK Query
- [ ] Imports grouped: external libs → internal modules → relative imports (blank line between groups)
- [ ] Atomic Design layer boundaries respected (atom/molecule/organism/template/page roles per CLAUDE.md §4)

### 19.B — If the PR touches user-facing copy

- [ ] Locked strings from spec §4 (hero), §5 (services), §6 (bios + recognition), §8 (contact section), §13 (passport) match **verbatim** — no paraphrasing
- [ ] Locked order from §5 (six service cards) and §6 (skills chips, recognition items, timeline entries) is preserved — no reordering
- [ ] Structured / long-form copy lives in `client/src/constants/` (per §18.9)
- [ ] Inline strings longer than 3 words have a corresponding test assertion (`getByText` or `getByRole`) in a `.test.jsx` file
- [ ] No "availability" claims anywhere ("X days per week", "Y hours per month", "available immediately") — see §2 / §18

### 19.C — If the PR touches theme tokens, `index.css`, or page-level wrappers

- [ ] Advisory pages (`/`, `/services`, `/team`, `/contact`) resolve `--color-bg-base` to `#FAFBFC` (DevTools-verifiable)
- [ ] `/passport` resolves `--color-bg-base` to `#0A1628` (dark Solana retained)
- [ ] Footer renders dark on every page (via `.footer-dark` class override of theme tokens)
- [ ] No `.gradient-text` class applied on any advisory surface
- [ ] Hero headline (`.hero-headline`) and section headers (`.section-display-heading`) use Fraunces on advisory pages; passport overrides back to Inter
- [ ] Cards on advisory pages use `box-shadow` elevation, not 1px borders
- [ ] Section-rhythm utility classes (`.section-rhythm-primary` / `.section-rhythm-alt`) used on the landing page sections per §7
- [ ] No leftover dark-charcoal values (`#1C1F26`, `#232732`) on advisory pages in computed styles

### 19.D — If the PR touches navigation

- [ ] Exactly four top-level navbar entries in order: Company · Services · Battery Passport · Contact
- [ ] No dropdown menus (Company is a single link, not a dropdown of "Why Ichnos" + "Team")
- [ ] On `/`: clicking Company / Services / Contact smooth-scrolls to `#company` / `#services` / `#contact`
- [ ] On `/`: clicking Battery Passport navigates to `/passport` (not a scroll)
- [ ] From any other route: Company → `/team`, Services → `/services`, Contact → `/contact`, Battery Passport → `/passport`
- [ ] Active state on `/` uses `useActiveSection` (IntersectionObserver, threshold ≈ 0.5) — scrollspy behavior
- [ ] Active state on other routes derives from `useLocation` pathname
- [ ] No navbar entry is active when the page is scrolled above the first section anchor
- [ ] Battery Passport navbar entry is route-based only (never scrollspy-active on `/`)

### 19.E — If the PR touches the chat surface

- [ ] A single `ChatPanel` molecule drives all three chat surfaces (modal widget, `/contact` inline, homepage `#contact` inline)
- [ ] `ChatPanel` accepts `mode="inline" | "modal"` and `persistState: boolean` props
- [ ] `ChatModal` is a thin wrapper around `<ChatPanel mode="modal" persistState={true} />`
- [ ] `/contact` page renders `<ChatPanel mode="inline" persistState={true} />`
- [ ] Homepage `#contact` section renders `<ChatPanel mode="inline" persistState={false} />`
- [ ] History fetch and pending-post-login send are gated on `persistState === true`
- [ ] Floating chat widget remains visible bottom-right on every page (unchanged)
- [ ] Server-side auth gating still applies regardless of `persistState` value

### 19.F — If the PR touches services content or layout

- [ ] Six service cards in the locked order from §5:
  1. Battery Systems & Safety Engineering · `bi-shield-check`
  2. Battery Mechanical Development · `bi-tools`
  3. Technical Lead — Battery Systems · `bi-person-workspace`
  4. EU–APAC Battery Compliance Bridge · `bi-globe-asia-australia`
  5. Battery Remanufacturing, Recycling & Circular Economy · `bi-arrow-repeat`
  6. Battery Passport Implementation · `bi-shield-fill-check` (or `bi-passport`)
- [ ] Card 6 description ends with a `<Link to="/passport">` "Learn more →" element
- [ ] Service Card 3 title is exactly `Technical Lead — Battery Systems` (no `& Passport Programs` suffix)
- [ ] Homepage `ServicesSnapshot` and `/services` both consume the same `services.js` constants
- [ ] All six cards present on both surfaces — no skipping on the homepage

### 19.G — If the PR touches team page content

- [ ] Francesco's `bio` matches the four-paragraph locked text in §6 exactly
- [ ] Francesco's 2025 timeline entry has:
  - title: `Self-directed upskilling in software engineering and AI integration`
  - organization: `Sigma School — 12-Week Software Development Bootcamp`
  - no remnants of `Web developer` anywhere
- [ ] Francesco's skills chips appear in the locked order from §6, including the **single combined** chip `Project Management & Agile (Scrum, PSM I)`
- [ ] Francesco's Recognition block renders below skills with: Award · Patents · Publications · Certification · Teaching subsections (all five present)
- [ ] PEM teaching ("battery recycling lessons at RWTH Aachen PEM") appears in either the bio or the Recognition block
- [ ] Ihsan's `bio` matches the three-paragraph locked text in §6 exactly
- [ ] Ihsan's title is `Co-Founder` (never `Technomathematician` or `Battery domain expert`)
- [ ] Ihsan's skills chips are exactly: AI Integration · Quantitative Modelling · Notified-Body Coordination · Methodical Excellence
- [ ] Ihsan's `showTimeline: false` is honored — his career timeline does not render on `/team`
- [ ] Ihsan's bio uses "chemical industry" not "battery industry" for the notified-body coordination experience
- [ ] `TEAM_PAGE_HEADER` title is `Meet the Team`

### 19.H — If the PR touches the `/passport` page

- [ ] Page wrapped in `<div className="theme-passport">…</div>` (or equivalent template) so dark theme tokens cascade
- [ ] MS 2818 / MARI dual-standard paragraph from §13 present in the hero or first content block
- [ ] Solana / Web3 / blockchain mentions are confined to this page only
- [ ] `FeatureMaturityMatrix` and `TechnologyRoadmap` render here (not on `/services`)
- [ ] Legacy `Ichnos Protocol` logo (`/logo-legacy.png`) used inside the page hero (corporate mark stays in navbar)
- [ ] Orphan narrative content from prior epic either recovered from git history OR fresh fallback copy from §13 used; do not block the phase on recovery
- [ ] Page reads as a complete, self-contained product story (not a teaser)

### 19.I — If the PR touches the contact surface

- [ ] Homepage `#contact` section renders: heading + subhead + inline `ChatPanel` + email + LinkedIn (company) + LinkedIn (founder) + Calendly + KL address — in that order
- [ ] `/contact` page renders the same elements plus an "About contacting us" intro paragraph
- [ ] Email is `francesco@ichnos-protocol.com` everywhere (no `maltonif@gmail.com` references)
- [ ] LinkedIn (company): `https://www.linkedin.com/company/ichnos-protocol/`
- [ ] LinkedIn (founder): `https://www.linkedin.com/in/maltonif/`
- [ ] Calendly URL pulled from `companyInfo.js`
- [ ] Address: `Ichnos Protocol Pte. Ltd. — 160 Robinson Road, #14-04 Singapore Business Federation Centre, Singapore 068914 · UEN 202606052196`
- [ ] Floating chat widget still appears on `/contact` (it's an addition, not a replacement)

### 19.J — If the PR touches imagery

- [ ] `client/public/bg-advisory.jpg` is referenced (not the obsolete `hero-bg.jpg`)
- [ ] `client/public/bg-footer.jpg` is referenced (not the obsolete `footer-bg.jpg`)
- [ ] No code reference to `hero-bg.jpg` or `footer-bg.jpg` remains
- [ ] Hero overlay opacity is in the 90–96% range (text contrast preserved)
- [ ] Footer overlay opacity is in the 85–92% range (text contrast preserved)
- [ ] Footer copyright line contains **no** "Photography:" credit (images are licensed iStockPhoto)
- [ ] Footer copyright reads: `© 2026 Ichnos Protocol Pte. Ltd. — All rights reserved.`

### 19.K — If the PR touches the landing page composition

- [ ] Section order on `/`: Hero → ServicesSnapshot → CompanySnapshot → PassportTeaser → ContactSnapshot → Footer
- [ ] Each section has the correct anchor ID for scrollspy: `#services`, `#company`, `#passport`, `#contact`
- [ ] Section backgrounds alternate per §7 (off-white → white → light-grey → white → light-grey → dark footer)
- [ ] Removed organisms (`SolutionOverview`, `ProblemStatement`, `WhyIchnos`, etc.) are dropped from `LandingPage.jsx` but their source files are not deleted (they may be referenced elsewhere)
- [ ] New organisms (`ServicesSnapshot`, `CompanySnapshot`, `PassportTeaser`, `ContactSnapshot` or extended `ContactSection`) exist and follow the Atomic Design length limits

### 19.L — Solana / Web3 containment (every PR)

- [ ] No mention of "Solana", "blockchain", "Web3", "crypto", or any related terminology on any advisory surface (`/`, `/services`, `/team`, `/contact`)
- [ ] Solana gradient (`--color-gradient-start` → `--color-gradient-end`) not applied anywhere outside `.theme-passport`
- [ ] These terms are allowed (and welcome) inside `/passport` only

### 19.M — Accessibility (when visual changes are introduced)

- [ ] Lighthouse contrast check: body text ≥ 4.5:1, large headlines ≥ 3:1 on the light theme
- [ ] Footer text passes ≥ 4.5:1 on the dark battery-internals overlay
- [ ] Mobile (<768px viewport): landing sections stack vertically; navbar collapses to hamburger; footer columns stack
- [ ] Hero headline wraps cleanly on narrow screens; eyebrow remains legible
- [ ] All interactive elements have visible focus states (keyboard navigation)
- [ ] Service cards remain readable when content is long (no clipped descriptions)

### 19.N — Final gate (before squash-merge)

- [ ] All applicable sections above are ticked
- [ ] PR description summarises the phase and links back to this spec
- [ ] No deviations from the spec; if a deviation was unavoidable, it is explicitly called out in the PR description with rationale
- [ ] Vercel preview deploy succeeds and renders the changes correctly on both desktop and mobile
- [ ] The phase's specific verification items from §15 (mapped to this phase) are checked manually on the preview

---

## 20. Notes for Traycer

- **Locked copy is locked**. Every quoted block in §4, §5, §6, §8, §13 is the final string. Do not paraphrase. If a string genuinely doesn't fit in the visual space, ask before changing it.
- **Order is locked**. Services cards, skills chips, recognition items, navbar entries, landing sections — render in the documented order. Do not reorder.
- **Atomic Design + length limits hold**. ≤120 lines per file, ≤60 JSX lines, ≤20 lines per function. If a file approaches the limit, extract a helper or sub-component.
- **Reuse atoms and molecules**. New organisms (`ServicesSnapshot`, `CompanySnapshot`, `PassportTeaser`, `RecognitionBlock`) compose existing atoms/molecules; do not duplicate existing primitives.
- **No availability claims**. No "X days per week", "Y hours per month", "available immediately", etc. anywhere.
- **No Solana on advisory pages**. Period.
- **Test files matter**. Update component tests to match the new copy, new ordering, and new components. Add tests for the new organisms.
- **Ihsan bio is non-negotiable**. The current battery-industry framing is factually inaccurate and a credibility risk. Replace with the locked text in §6.

If anything in this spec is ambiguous or contradicts something else, surface the conflict in a comment on the PR rather than guessing.

---

## 21. SEO and structured data

Search-engine and social-share metadata is **already partially shipped** as part of this epic — constants and static assets are landed, but Traycer must wire the new fields into each page's `Helmet` block. The audit and fixes against 2026 SEO best practices are summarised below.

### 21.1 Landed already (no Traycer work required)

| File | Status | Purpose |
|---|---|---|
| `client/src/constants/seoMeta.js` | **Rewritten** | All page meta (LANDING, SERVICES, TEAM, PASSPORT, CONTACT, PRIVACY). Canonical domain fixed (`ichnos-protocol.com`). Each export now includes `canonical`, `og.{title,description,type,url,siteName,locale,image,imageAlt}`, and `twitter.{card,title,description,image,imageAlt}`. Copy aligned with advisory-first positioning, MS 2818/MARI mentioned on passport, both co-founders on team. |
| `client/src/constants/structuredData.js` | **New** | JSON-LD schemas: `ORGANIZATION_SCHEMA`, `WEBSITE_SCHEMA`, `FOUNDER_PERSON_SCHEMA`, `COFOUNDER_PERSON_SCHEMA`, six `SERVICE_SCHEMAS`, and `PAGE_STRUCTURED_DATA` keyed by page (`landing`, `services`, `team`, `passport`, `contact`). |
| `client/index.html` | **Rewritten** | Default `<title>` is advisory-first. `theme-color`, `og:site_name`, `og:locale`, `og:image`, `twitter:card`, `apple-touch-icon`, `manifest`, preconnect for fonts + Firebase, Fraunces + Inter font loading. |
| `client/public/robots.txt` | **New** | Allows public crawlers, blocks `/admin`, `/privacy`, and AI training crawlers (GPTBot, anthropic-ai, ClaudeBot, CCBot, Google-Extended). Points at `/sitemap.xml`. |
| `client/public/sitemap.xml` | **New** | Lists `/`, `/services`, `/team`, `/passport`, `/contact` with `changefreq` and `priority`. |
| `client/public/og-image.jpg` | **New** | 1200×630 crop of `bg-advisory.jpg` for LinkedIn / X / Slack / WhatsApp shares. |
| `client/public/apple-touch-icon.png` | **New** | 180×180 iOS icon — cyan glyph on white background. |
| `client/public/site.webmanifest` | **New** | Minimal PWA manifest. |

### 21.2 What Traycer must wire (per-page Helmet refactor)

Each `<Helmet>` block in the page components must be updated to consume the new fields from `seoMeta.js` and to render the page-keyed structured data from `structuredData.js`. The pattern below is the canonical form; apply to every page.

```jsx
import { Helmet } from "react-helmet-async";
import { LANDING_META } from "../../constants/seoMeta";
import { PAGE_STRUCTURED_DATA } from "../../constants/structuredData";

// ... inside the component:
<Helmet>
  <title>{LANDING_META.title}</title>
  <meta name="description" content={LANDING_META.description} />
  <meta name="keywords" content={LANDING_META.keywords} />
  <link rel="canonical" href={LANDING_META.canonical} />

  {/* Open Graph */}
  <meta property="og:title" content={LANDING_META.og.title} />
  <meta property="og:description" content={LANDING_META.og.description} />
  <meta property="og:type" content={LANDING_META.og.type} />
  <meta property="og:url" content={LANDING_META.og.url} />
  <meta property="og:site_name" content={LANDING_META.og.siteName} />
  <meta property="og:locale" content={LANDING_META.og.locale} />
  <meta property="og:image" content={LANDING_META.og.image} />
  <meta property="og:image:alt" content={LANDING_META.og.imageAlt} />

  {/* Twitter / X */}
  <meta name="twitter:card" content={LANDING_META.twitter.card} />
  <meta name="twitter:title" content={LANDING_META.twitter.title} />
  <meta name="twitter:description" content={LANDING_META.twitter.description} />
  <meta name="twitter:image" content={LANDING_META.twitter.image} />
  <meta name="twitter:image:alt" content={LANDING_META.twitter.imageAlt} />

  {/* JSON-LD structured data */}
  {PAGE_STRUCTURED_DATA.landing.map((schema, i) => (
    <script key={i} type="application/ld+json">
      {JSON.stringify(schema)}
    </script>
  ))}
</Helmet>
```

Pages requiring this refactor: `LandingPage`, `ServicesPage`, `TeamPage`, `PassportPage`, `ContactPage`, `PrivacyPage`. Each substitutes the page's own `*_META` constant and `PAGE_STRUCTURED_DATA.<key>` array.

**Extraction suggestion** (optional, Traycer's call): factor the boilerplate into a small `<SeoHead meta={...} schemas={...} />` molecule under `client/src/components/molecules/` to keep each page's `Helmet` block concise. Pure presentational — no state.

### 21.3 SEO verification additions (folds into §15)

- [ ] Every page's `<title>` matches its `*_META.title` constant
- [ ] Every page renders a `<link rel="canonical" href="...">` matching its `*_META.canonical`
- [ ] Every page renders `og:image`, `og:image:alt`, `og:site_name`, `og:locale` — not just title/description/url
- [ ] Every page renders `twitter:card`, `twitter:image`
- [ ] Every page renders the appropriate JSON-LD schemas via `PAGE_STRUCTURED_DATA.<key>`
- [ ] Static `<title>` in `client/index.html` is advisory-first, not passport-first
- [ ] `client/public/robots.txt` is served correctly at `https://ichnos-protocol.com/robots.txt` after deploy
- [ ] `client/public/sitemap.xml` is served correctly at `https://ichnos-protocol.com/sitemap.xml` after deploy
- [ ] `https://ichnos-protocol.com/og-image.jpg` returns 200 and renders as a preview when the URL is shared on LinkedIn
- [ ] No reference to `ichnosprotocol.com` (without hyphen) remains anywhere in the codebase
- [ ] [Google Rich Results test](https://search.google.com/test/rich-results) passes for each page after deploy
- [ ] [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) shows correct title + description + OG image for each page

### 21.4 SEO PR review checklist (folds into §19)

When a PR touches `seoMeta.js`, `structuredData.js`, `index.html`, `robots.txt`, `sitemap.xml`, or any page-level `Helmet` block:

- [ ] Canonical domain is `https://ichnos-protocol.com` (with hyphen) — never `ichnosprotocol.com`
- [ ] Title length ≤ 60 chars; description length 120–155 chars (sweet spot for Google SERP)
- [ ] Every page passes `canonical`, `og:*`, `twitter:*`, and JSON-LD through `<Helmet>` — no missing fields
- [ ] If a service is added/removed/renamed, `SERVICE_SCHEMAS` in `structuredData.js` is kept in sync with `services.js`
- [ ] If the address/UEN/founder changes, `ORGANIZATION_SCHEMA` is updated
- [ ] `sitemap.xml` is updated if a new public route is added
- [ ] `robots.txt` Disallow list is updated if a new non-indexable route is added

### 21.5 Out of scope (deferred)

- **Per-route hreflang** — single English version; revisit if Italian or German translations are added later
- **Structured data for individual blog posts / case studies** — no blog yet
- **Performance optimisation of `og-image.jpg`** (currently 177 KB, fine for LinkedIn cache)
- **Bing Webmaster Tools / Google Search Console verification meta tags** — Francesco adds these to `index.html` once accounts are created
- **AI-crawler-blocking strategy review** — current `robots.txt` blocks GPTBot, anthropic-ai, ClaudeBot, CCBot, Google-Extended. Flip individual entries to `Allow: /` if you decide you want AI surfaces to index Ichnos content.
