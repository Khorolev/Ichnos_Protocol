// SEO meta — single source of truth consumed by per-page <Helmet> blocks.
// Updates here propagate to every page. Keep titles ≤ 60 chars and descriptions
// in the 120–155 char sweet spot for Google SERP rendering.
//
// Canonical domain is ichnos-protocol.com (hyphenated). The unhyphenated
// variant is intentionally NOT used anywhere — see DEPLOYMENT_GITHUB_ACTIONS.md.

const BASE_URL = "https://ichnos-protocol.com";
const SITE_NAME = "Ichnos Protocol";
const LOCALE = "en_US";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`;
const DEFAULT_OG_IMAGE_ALT =
  "Ichnos Protocol — battery advisory and Battery Passport implementation";

function buildMeta({ path, title, description, keywords, ogImage, ogImageAlt }) {
  const url = `${BASE_URL}${path}`;
  const image = ogImage || DEFAULT_OG_IMAGE;
  const imageAlt = ogImageAlt || DEFAULT_OG_IMAGE_ALT;
  return {
    title,
    description,
    keywords,
    canonical: url,
    og: {
      title,
      description,
      type: "website",
      url,
      siteName: SITE_NAME,
      locale: LOCALE,
      image,
      imageAlt,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      image,
      imageAlt,
    },
  };
}

export const LANDING_META = buildMeta({
  path: "/",
  title: "Ichnos Protocol — Battery Advisory & Battery Passport",
  description:
    "Battery advisory for OEMs, Tier-1 suppliers, and recyclers — systems engineering, safety, mechanical development, EU 2023/1542 and APAC compliance.",
  keywords:
    "battery advisory, battery systems engineering, battery safety, mechanical development, EU Battery Regulation, battery passport, MS 2818, APAC battery compliance, ASEAN, circular economy",
});

export const SERVICES_META = buildMeta({
  path: "/services",
  title: "Services — Ichnos Protocol Battery Advisory",
  description:
    "Battery systems & safety, mechanical development, technical lead, EU–APAC compliance, remanufacturing & circular economy, Battery Passport implementation.",
  keywords:
    "battery systems engineering, FMEA, battery safety, battery mechanical development, battery technical lead, EU 2023/1542, MS 2818, remanufacturing, design for recycling, battery passport implementation",
});

export const TEAM_META = buildMeta({
  path: "/team",
  title: "Meet the Team — Ichnos Protocol",
  description:
    "Dr.-Ing. Francesco Maltoni (Founder, ex-FEV Lead Expert — Battery Systems) and Ihsan Ahmad (Co-Founder, AI & quantitative modelling).",
  keywords:
    "Francesco Maltoni, Ihsan Ahmad, RWTH Aachen PEM, FEV Battery Systems, battery passport expert, EU Battery Regulation, Singapore battery consulting, APAC battery advisory",
});

export const PASSPORT_META = buildMeta({
  path: "/passport",
  title: "Battery Passport — Ichnos Protocol",
  description:
    "Digital Battery Passport aligned with EU Regulation 2023/1542 and Malaysian MS 2818 (MARI). Built for OEMs exporting between Europe and ASEAN.",
  keywords:
    "battery passport, EU Battery Regulation 2023/1542, MS 2818, MARI, digital product passport, Solana, supply chain transparency, circular economy, ASEAN battery compliance",
});

export const CONTACT_META = buildMeta({
  path: "/contact",
  title: "Contact — Ichnos Protocol Battery Advisory",
  description:
    "Talk to Ichnos Protocol — chat with our AI assistant, send an inquiry, or book a call. Battery advisory and Battery Passport implementation, Singapore + EU.",
  keywords:
    "contact battery advisory, battery consulting Singapore, battery passport consultation, schedule battery engineering call",
});

export const PRIVACY_META = buildMeta({
  path: "/privacy",
  title: "Privacy & Data Management — Ichnos Protocol",
  description:
    "Manage your personal data with Ichnos Protocol: download your records or delete your account. GDPR-aligned controls for our visitors and customers.",
  keywords: "privacy, data management, GDPR, account deletion",
});

// Convenience: full list — used by sitemap generation and validation tests.
export const ALL_META = [
  LANDING_META,
  SERVICES_META,
  TEAM_META,
  PASSPORT_META,
  CONTACT_META,
  PRIVACY_META,
];

// Re-exported scalars for use by structured-data builders and the static
// document head.
export const SEO_BASE_URL = BASE_URL;
export const SEO_SITE_NAME = SITE_NAME;
export const SEO_LOCALE = LOCALE;
export const SEO_DEFAULT_OG_IMAGE = DEFAULT_OG_IMAGE;
