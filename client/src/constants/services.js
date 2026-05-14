export const SERVICES_LIST = [
  {
    id: "battery-systems-safety",
    icon: "bi-shield-check",
    title: "Battery Systems & Safety Engineering",
    tagline:
      "System architecture, requirement and test management, and full FMEA discipline.",
    description:
      "System architecture, requirement and test management, and full FMEA discipline — S-FMEA, D-FMEA, P-FMEA — across cell, module, and pack levels. Test planning, traceability, and design-review support for battery development programs that need rigorous engineering process from concept to SOP.",
    pillar: "engineering",
    deliveryMethod: false,
  },
  {
    id: "battery-mechanical-development",
    icon: "bi-tools",
    title: "Battery Mechanical Development",
    tagline:
      "Pack architecture, cell housing, thermal hardware, and design-for-manufacture.",
    description:
      "Pack and module mechanical design, cell housing, thermal hardware integration, and design-for-manufacture. Drawing on a doctorate in Production Engineering of E-Mobility Components and patents on battery modules and aluminium cell housings.",
    pillar: "engineering",
    deliveryMethod: false,
  },
  {
    id: "eu-apac-compliance-bridge",
    icon: "bi-globe-asia-australia",
    title: "EU–APAC Battery Compliance Bridge",
    tagline:
      "Translating European battery regulation into APAC supply-chain reality — and vice versa.",
    description:
      "Translating European battery regulation into APAC (including ASEAN) supply-chain reality — and vice versa. Coverage includes EU 2023/1542, Malaysian MS 2818, regional certification frameworks, and supplier alignment for OEMs operating across both regions. Practitioner-grade understanding of where regulatory text meets the factory floor.",
    pillar: "compliance",
    deliveryMethod: false,
  },
  {
    id: "battery-passport-implementation",
    icon: "bi-shield-fill-check",
    title: "Battery Passport Implementation",
    tagline:
      "EU 2023/1542 and MS 2818 readiness audits, gap analyses, and end-to-end implementation.",
    description:
      "EU 2023/1542 and Malaysian MS 2818 readiness audits, gap analyses, and end-to-end implementation: data model design, supplier data collection workflows, and carbon-footprint pipelines. Tied directly to the digital Battery Passport platform Ichnos Protocol is building — see /passport.",
    passportLink: "/passport",
    pillar: "compliance",
    deliveryMethod: false,
  },
  {
    id: "remanufacturing-recycling-circular-economy",
    icon: "bi-arrow-repeat",
    title: "Battery Remanufacturing, Recycling & Circular Economy",
    tagline:
      "Second-life pathways, design for remanufacturing, design for recycling, design for cost.",
    description:
      "Second-life pathways, design for remanufacturing, design for recycling, and design for cost. PhD-level expertise in circular-economy battery systems — backed by the 3rd-place RWTH Innovation Award and four peer-reviewed publications on remanufacturing, recycling, and cell housing design. Founder lectured on battery recycling at the RWTH Aachen PEM Chair.",
    pillar: "circularity",
    deliveryMethod: false,
  },
  {
    id: "technical-lead-battery-systems",
    icon: "bi-person-workspace",
    title: "Technical Lead — Battery Systems",
    tagline:
      "Embedded technical leadership and agile project management for battery development programs.",
    description:
      "Embedded senior battery expertise for early-stage teams and in-house programs that need experienced direction without a full-time hire — combined with sprint cadence, requirement traceability, milestone management, and cross-functional coordination. PSM I (Professional Scrum Master™ I) certified, backed by thirteen years of cross-functional project engineering across Ducati, Technogym, and FEV — from gasoline engines and motorcycle design through electrification and vehicle battery systems.",
    pillar: "engineering",
    deliveryMethod: false,
  },
];

export const SERVICES_PAGE_CONTENT = {
  title: "Services & Solutions",
  subtitle: "Expert consulting for the battery regulation landscape.",
};

export const SERVICE_PILLARS = [
  { id: "engineering", label: "Engineering", anchor: "engineering" },
  { id: "compliance", label: "Compliance", anchor: "compliance" },
  { id: "circularity", label: "Circularity", anchor: "circularity" },
];

// Note: DELIVERY_METHODS_HEADER and getDeliveryMethodServices() removed —
// Technical Lead is now part of the Engineering pillar (3 services) so there
// is no separate Delivery Models section on /services any more.

export function getServicesByPillar(pillarId) {
  return SERVICES_LIST.filter((s) => s.pillar === pillarId);
}
