export const SERVICES_LIST = [
  {
    id: "regulation-compliance",
    title: "Battery Regulation Compliance",
    description:
      "Gap analysis, compliance roadmap, and documentation preparation for the EU Battery Regulation.",
    details: [
      "Regulatory gap analysis against EU Battery Regulation requirements",
      "Compliance roadmap with milestones and deliverables",
      "Documentation preparation and review",
    ],
  },
  {
    id: "homologation",
    title: "Homologation Support",
    description:
      "End-to-end support for type approval processes, including coordination with notified bodies in the EU.",
    details: [
      "Type approval process management",
      "Coordination with EU notified bodies",
      "Technical documentation for homologation dossiers",
    ],
  },
  {
    id: "testing-coordination",
    title: "Testing Center Coordination",
    description:
      "Selection of and liaison with accredited testing centers for battery safety, performance, and durability.",
    details: [
      "Accredited testing center selection",
      "Test plan development and review",
      "Liaison and results interpretation",
    ],
  },
  {
    id: "requirement-management",
    title: "Requirement Management",
    description:
      "Structuring and managing technical, legal, and regulatory requirements for battery system development.",
    details: [
      "Technical requirement structuring",
      "Legal and regulatory requirement tracking",
      "Traceability matrix management",
    ],
  },
  {
    id: "passport-development",
    title: "Battery Passport Development",
    description:
      "Help your engineering team build a Battery Passport solution tailored to your products and processes.",
    details: [
      "Architecture consulting for passport systems",
      "Data model design and integration support",
      "Tailored to your product line and processes",
    ],
  },
  {
    id: "circular-economy",
    title: "Circular Economy Strategy",
    description:
      "Advisory on remanufacturing, repurposing, and second-life strategies to maximize battery asset value.",
    details: [
      "Remanufacturing feasibility assessment",
      "Second-life application strategy",
      "Asset value maximization roadmap",
    ],
  },
];

export const BATTERY_PASSPORT_FEATURES = [
  {
    feature: "Composition & Materials Data",
    mandated: true,
    status: "Updating",
    phase: "Prototype",
  },
  {
    feature: "Identification and Labeling",
    mandated: true,
    status: "Updating",
    phase: "Prototype",
  },
  {
    feature: "Performance & Reliability",
    mandated: true,
    status: "Updating",
    phase: "Prototype",
  },
  {
    feature: "Recycled and Recovered Materials",
    mandated: true,
    status: "Updating",
    phase: "Prototype",
  },
  {
    feature: "Carbon Footprint Declaration",
    mandated: true,
    status: "In Development",
    phase: "Prototype",
  },
  {
    feature: "Supply Chain Due Diligence",
    mandated: true,
    status: "In Development",
    phase: "Prototype",
  },
  {
    feature: "Remanufacturing Readiness Score",
    mandated: false,
    status: "Planned",
    phase: "Prototype",
  },
  {
    feature: "Second-Life Application Matching",
    mandated: false,
    status: "Planned",
    phase: "Production",
  },
  // Deferred to later stage
  // {
  //   feature: "SME Marketplace Integration",
  //   mandated: false,
  //   status: "Planned",
  //   phase: "Production",
  // },
  {
    feature: "Degradation Forecasting",
    mandated: false,
    status: "Planned",
    phase: "Production",
  },
  {
    feature: "Repurposer/Remanufacturer Tools",
    mandated: false,
    status: "Planned",
    phase: "Production",
  },
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

export const SERVICES_PAGE_CONTENT = {
  title: "Services & Solutions",
  subtitle:
    "Expert consulting and the Battery Passport platform — built for the battery regulation landscape.",
};

export const SERVICES_LIST_CONTENT = {
  heading: "Our Services",
  subtext:
    "Consulting and development services for the battery regulation landscape.",
};

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

export const CONTACT_SECTION_CONTENT = {
  heading: "Get in Touch",
  subtext:
    "Ready to discuss your battery compliance needs? Reach out directly.",
  contactCardTitle: "Contact",
  companyCardTitle: "Company Details",
  links: {
    linkedInCompany: "LinkedIn Company Page",
    linkedInFounder: "LinkedIn Founder",
    bookMeeting: "Book a Meeting",
  },
  labels: {
    legalName: "Legal Name:",
    uen: "UEN:",
    address: "Address:",
  },
};

export const TARGET_INDUSTRIES = [
  "Automotive",
  "Motorcycle",
  "Energy Storage",
  "Industrial Equipment",
  "Marine",
  "Aviation",
];
