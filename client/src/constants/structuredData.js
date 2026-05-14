// JSON-LD structured data for search engines (Schema.org).
// Each page renders one or more of these schemas inside a <script type="application/ld+json">
// tag injected via react-helmet-async. The Organization schema is global; per-page
// schemas (Person, Service, etc.) attach where they make sense.
//
// Reference: https://schema.org/

import { SEO_BASE_URL, SEO_SITE_NAME } from "./seoMeta";

const LOGO_URL = `${SEO_BASE_URL}/logo-dark.png`;

export const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SEO_SITE_NAME,
  legalName: "Ichnos Protocol Pte. Ltd.",
  url: SEO_BASE_URL,
  logo: LOGO_URL,
  email: "francesco@ichnos-protocol.com",
  description:
    "Battery advisory practice and Battery Passport platform builder, based in Singapore and operating across Europe and APAC.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "160 Robinson Road, #14-04 Singapore Business Federation Centre",
    addressLocality: "Singapore",
    postalCode: "068914",
    addressCountry: "SG",
  },
  identifier: { "@type": "PropertyValue", name: "UEN", value: "202606052196" },
  sameAs: [
    "https://www.linkedin.com/company/ichnos-protocol/",
    "https://www.linkedin.com/in/maltonif/",
  ],
  founder: [
    { "@type": "Person", name: "Francesco Maltoni" },
    { "@type": "Person", name: "Ihsan Ahmad" },
  ],
  areaServed: ["EU", "APAC", "ASEAN"],
};

export const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SEO_SITE_NAME,
  url: SEO_BASE_URL,
  inLanguage: "en",
};

export const FOUNDER_PERSON_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Dr.-Ing. Francesco Maltoni",
  jobTitle: "Founder",
  worksFor: { "@type": "Organization", name: SEO_SITE_NAME, url: SEO_BASE_URL },
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "RWTH Aachen University" },
    { "@type": "CollegeOrUniversity", name: "Università di Bologna" },
  ],
  knowsAbout: [
    "Battery Systems Engineering",
    "Battery Safety",
    "Battery Mechanical Development",
    "Battery Remanufacturing",
    "Circular Economy",
    "EU Battery Regulation 2023/1542",
    "Battery Passport (DIN DKE SPEC 99100)",
    "Malaysian Standard MS 2818",
  ],
  sameAs: ["https://www.linkedin.com/in/maltonif/"],
};

export const COFOUNDER_PERSON_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Ihsan Ahmad",
  jobTitle: "Co-Founder",
  worksFor: { "@type": "Organization", name: SEO_SITE_NAME, url: SEO_BASE_URL },
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "Karlsruhe Institute of Technology" },
    { "@type": "CollegeOrUniversity", name: "Universität Mannheim" },
  ],
  knowsAbout: [
    "AI Integration",
    "Quantitative Modelling",
    "Notified-Body Coordination",
  ],
};

function service(name, description) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    provider: { "@type": "Organization", name: SEO_SITE_NAME, url: SEO_BASE_URL },
    areaServed: ["EU", "APAC", "ASEAN"],
  };
}

export const SERVICE_SCHEMAS = [
  service(
    "Battery Systems & Safety Engineering",
    "System architecture, requirement and test management, and full FMEA discipline (S-FMEA, D-FMEA, P-FMEA) across cell, module, and pack levels.",
  ),
  service(
    "Battery Mechanical Development",
    "Pack and module mechanical design, cell housing, thermal hardware integration, and design-for-manufacture.",
  ),
  service(
    "Technical Lead — Battery Systems",
    "Embedded technical leadership for battery systems development programs.",
  ),
  service(
    "EU–APAC Battery Compliance Bridge",
    "Translating European battery regulation into APAC (incl. ASEAN) supply-chain reality and vice versa. Covers EU 2023/1542, Malaysian MS 2818, regional certification, and supplier alignment.",
  ),
  service(
    "Battery Remanufacturing, Recycling & Circular Economy",
    "Second-life pathways, design for remanufacturing, design for recycling, and design for cost.",
  ),
  service(
    "Battery Passport Implementation",
    "EU 2023/1542 and Malaysian MS 2818 readiness audits, gap analyses, and end-to-end implementation including data model, supplier data collection workflows, and carbon-footprint pipelines.",
  ),
];

function breadcrumb(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SEO_BASE_URL}${item.path}`,
    })),
  };
}

// Page-keyed schema bundles. Each page renders the array of schemas for its key.
export const PAGE_STRUCTURED_DATA = {
  landing: [ORGANIZATION_SCHEMA, WEBSITE_SCHEMA],
  services: [
    ORGANIZATION_SCHEMA,
    breadcrumb([
      { name: "Home", path: "/" },
      { name: "Services", path: "/services" },
    ]),
    ...SERVICE_SCHEMAS,
  ],
  team: [
    ORGANIZATION_SCHEMA,
    breadcrumb([
      { name: "Home", path: "/" },
      { name: "Team", path: "/team" },
    ]),
    FOUNDER_PERSON_SCHEMA,
    COFOUNDER_PERSON_SCHEMA,
  ],
  passport: [
    ORGANIZATION_SCHEMA,
    breadcrumb([
      { name: "Home", path: "/" },
      { name: "Battery Passport", path: "/passport" },
    ]),
  ],
  contact: [
    ORGANIZATION_SCHEMA,
    breadcrumb([
      { name: "Home", path: "/" },
      { name: "Contact", path: "/contact" },
    ]),
  ],
  privacy: [ORGANIZATION_SCHEMA],
};
