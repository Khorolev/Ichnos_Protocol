export const BATTERY_PASSPORT_FEATURES = [
  { feature: "Composition & Materials Data", mandated: true, status: "Updating", phase: "Prototype" },
  { feature: "Identification and Labeling", mandated: true, status: "Updating", phase: "Prototype" },
  { feature: "Performance & Reliability", mandated: true, status: "Updating", phase: "Prototype" },
  { feature: "Recycled and Recovered Materials", mandated: true, status: "Updating", phase: "Prototype" },
  { feature: "Carbon Footprint Declaration", mandated: true, status: "In Development", phase: "Prototype" },
  { feature: "Supply Chain Due Diligence", mandated: true, status: "In Development", phase: "Prototype" },
  { feature: "Remanufacturing Readiness Score", mandated: false, status: "Planned", phase: "Prototype" },
  { feature: "Second-Life Application Matching", mandated: false, status: "Planned", phase: "Production" },
  // Deferred to later stage
  // {
  //   feature: "SME Marketplace Integration",
  //   mandated: false,
  //   status: "Planned",
  //   phase: "Production",
  // },
  { feature: "Degradation Forecasting", mandated: false, status: "Planned", phase: "Production" },
  { feature: "Repurposer/Remanufacturer Tools", mandated: false, status: "Planned", phase: "Production" },
];

export const ROADMAP_PHASES = [
  {
    id: "prototype",
    title: "Prototype Phase",
    badge: "CURRENT",
    description:
      "SQL (PostgreSQL) and NoSQL (Firestore) databases for rapid iteration and validation of the data model.",
    features: [
      "PostgreSQL for structured battery data",
      "Firestore for document storage and metadata",
      "Rapid iteration on data model and APIs",
      "Full compliance with DIN SPEC 99100 requirements",
      "Validation with early adopters",
    ],
  },
  {
    id: "production",
    title: "Production Phase",
    badge: "PLANNED",
    description:
      "Migration to Solana blockchain for immutable, decentralized battery lifecycle records with user engagement features.",
    features: [
      "Solana blockchain for immutable records",
      "DID based identity management for batteries and stakeholders",
      "Decentralized battery lifecycle tracking",
      "Transparent provenance and audit trail",
      "Cross-platform interoperability",
    ],
  },
];

export const FEATURE_MATRIX_CONTENT = {
  heading: "Battery Passport: Feature Maturity Matrix",
  subtext:
    "Beyond DIN SPEC 99100 — delivering real utility for the battery lifecycle.",
  columns: {
    feature: "Feature",
    mandated: "Mandated",
    status: "Status",
    phase: "Phase",
  },
};

export const TECHNOLOGY_ROADMAP_CONTENT = {
  heading: "Technology Roadmap",
  subtext:
    "A staged architecture from rapid prototyping to blockchain-backed production.",
  footer:
    "The Solana choice aligns with the project's values: high throughput, low cost, and a growing ecosystem of sustainability-focused decentralized applications.",
};

export const PASSPORT_PAGE_CONTENT = {
  pageTitle: "Battery Passport",
  productMark: "— ICHNOS PROTOCOL —",
  title: "The Ichnos Battery Passport",
  subtitle:
    "EU Battery Regulation compliance, supply-chain transparency, and circular-economy readiness — in one digital passport.",
  statusBadge: "PROTOTYPE PHASE",
};
