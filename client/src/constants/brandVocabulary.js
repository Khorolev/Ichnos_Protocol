/**
 * Brand vocabulary — single source of truth.
 *
 * Why this file exists
 * --------------------
 * The three pillars (Engineering / Compliance / Circularity) and the brand
 * tagline showed up — independently — in at least seven places: services
 * data, hero copy, footer text, services snapshot badges, services page
 * pillar order, the Footer's pillar links, and tests. Every refactor was a
 * fresh chance to drift (capitalisation, ordering, sentence vs. title case).
 *
 * Best practice for resisting this drift is a small, well-typed vocabulary
 * module that every consumer imports from. If you ever need to rename a
 * pillar or restyle the tagline, the change is mechanical and one file wide.
 *
 * Conventions
 * -----------
 *   - Pillar `id`s are kebab-case lowercase and ALSO serve as DOM anchor ids
 *     on /services. They are stable — renaming an id is a breaking change
 *     because the footer's `scrollTo` state and the page's section ids both
 *     depend on it.
 *   - `label` is the human, title-cased form used in section headings and
 *     navigation.
 *   - `badgeLabel` is the SCREAMING form used on service cards.
 *   - Order is locked: Engineering → Compliance → Circularity. Both the
 *     /services page and the footer render in this order.
 *
 * Adding a fourth pillar (e.g. Engineering → Compliance → Circularity →
 * Software) requires only: (a) a new entry in PILLARS, (b) appending the id
 * to PILLAR_ORDER, (c) tagging one or more services with the new pillar id
 * in services.js.
 */

export const PILLARS = Object.freeze({
  engineering: Object.freeze({
    id: "engineering",
    label: "Engineering",
    badgeLabel: "ENGINEERING",
    anchor: "engineering",
  }),
  compliance: Object.freeze({
    id: "compliance",
    label: "Compliance",
    badgeLabel: "COMPLIANCE",
    anchor: "compliance",
  }),
  circularity: Object.freeze({
    id: "circularity",
    label: "Circularity",
    badgeLabel: "CIRCULARITY",
    anchor: "circularity",
  }),
});

// Locked rendering order. Consumers must NOT re-derive an order from
// Object.keys(PILLARS) — JS object key order is technically stable, but
// the lock belongs here, not in the language spec.
export const PILLAR_ORDER = ["engineering", "compliance", "circularity"];

export const PILLAR_LIST = PILLAR_ORDER.map((id) => PILLARS[id]);

export function getPillar(id) {
  return PILLARS[id] ?? null;
}

export function getPillarBadgeLabel(id) {
  return PILLARS[id]?.badgeLabel ?? null;
}

// Taglines are derived so they cannot drift from the pillar labels above.
// Sentence-case variant: first word capitalised, rest lowercase, comma-list.
const PILLAR_LABELS = PILLAR_LIST.map((p) => p.label);
const TAIL_LOWERCASE = PILLAR_LABELS.slice(1).map((l) => l.toLowerCase());

export const BRAND_TAGLINE = `${PILLAR_LABELS.join(". ")}.`;
export const BRAND_TAGLINE_LOWER = `${PILLAR_LABELS[0]}, ${TAIL_LOWERCASE.join(", ")}.`;

// Hero eyebrow — narrative copy that references two of the pillars but is
// NOT a list of them, so it is intentionally not derived from PILLARS.
// Treat as a brand asset: change with care, update OG/Twitter card if so.
export const HERO_EYEBROW =
  "FROM REGULATORY COMPLIANCE TO REAL-WORLD CIRCULARITY";
