/**
 * Seed Firestore Knowledge Base
 *
 * Populates the knowledge_base collection with initial documents
 * for the RAG chatbot. Idempotent — skips documents that already exist.
 *
 * This script is for MANUAL SEEDING of company-specific knowledge.
 * For other knowledge sources, use the appropriate pipeline:
 *
 * 1. Simple PDFs (text-only):
 *    node server/scripts/extractPdfKnowledgeLegacy.js <file.pdf>
 *
 * 2. Complex PDFs (tables, equations, diagrams):
 *    python server/scripts/python/convertPdfToMarkdown.py --input <file.pdf> --output-dir ./markdown
 *    node server/scripts/extractMarkdownKnowledge.js ./markdown/<file>.md
 *
 * 3. Web content (Catena-X, GBA, technical documentation):
 *    node server/scripts/extractWebKnowledge.js <url> [--category <name>] [--selector <css>]
 *
 * See server/scripts/README.md for complete workflow documentation.
 *
 * Usage: node server/scripts/seedKnowledgeBase.js
 */
import "dotenv/config";
import firebaseAdmin from "../src/config/firebase.js";

const COLLECTION = "knowledge_base";

const SEED_DOCUMENTS = [
  {
    title: "Battery Passport Overview",
    content:
      "The Ichnos Battery Passport is a digital product passport designed for batteries in compliance with the EU Battery Regulation (2023/1542). It provides full traceability of a battery's lifecycle — from raw material sourcing and manufacturing through usage, second-life applications, and end-of-life recycling. The passport stores critical data including battery chemistry, capacity, state of health, carbon footprint, and supply chain due diligence information. It enables manufacturers, regulators, and recyclers to access standardized, interoperable data via a unique QR code or digital link assigned to each battery.",
    category: "battery_passport",
    tags: ["battery", "passport", "traceability", "lifecycle", "digital"],
  },
  {
    title: "EU Battery Regulation Compliance",
    content:
      "The EU Battery Regulation (Regulation 2023/1542) mandates that all industrial, electric vehicle, and light means of transport batteries placed on the EU market must carry a digital battery passport by February 2027. Key requirements include: declaration of carbon footprint, minimum recycled content thresholds, supply chain due diligence documentation, performance and durability metrics, and a unique battery identifier. Ichnos Protocol helps manufacturers meet these obligations by providing a turnkey platform that collects, validates, and publishes the required data in the standardized format defined by the European Commission.",
    category: "batteries",
    tags: ["regulation", "EU", "compliance", "2027", "mandatory"],
  },
  {
    title: "Homologation and Type Approval",
    content:
      "Battery homologation refers to the process of certifying that a battery meets all applicable regulatory requirements for a specific market. In the EU, this includes UN ECE R100 for electric vehicle battery safety, IEC 62660 for performance testing, and the forthcoming battery passport requirements under the EU Battery Regulation. Ichnos Protocol streamlines homologation by maintaining a centralized record of all test results, certifications, and compliance documents. Our platform integrates with testing laboratories and certification bodies to automate data collection and validation, reducing time-to-market for battery manufacturers.",
    category: "homologation",
    tags: ["homologation", "certification", "safety", "testing", "approval"],
  },
  {
    title: "Ichnos Protocol Services",
    content:
      "Ichnos Protocol offers three core services: (1) Battery Passport Platform — a SaaS solution for creating, managing, and publishing digital battery passports compliant with EU regulations. (2) Compliance Consulting — expert advisory services helping manufacturers navigate the EU Battery Regulation, prepare documentation, and achieve certification. (3) Data Integration — custom API integrations connecting your existing ERP, MES, and quality management systems with the Ichnos platform for automated data collection. Our team of battery experts and software engineers works closely with clients to ensure seamless adoption and ongoing compliance.",
    category: "battery_passport",
    tags: ["services", "platform", "consulting", "integration", "SaaS"],
  },
  {
    title: "Supply Chain Due Diligence",
    content:
      "The EU Battery Regulation requires battery manufacturers to implement supply chain due diligence policies aligned with international standards such as the OECD Due Diligence Guidance. This includes identifying and assessing risks related to human rights abuses, environmental harm, and conflict minerals in the battery supply chain. Ichnos Protocol provides tools for mapping your supply chain, collecting supplier declarations, and generating the due diligence reports required for the battery passport. Our platform supports audit trails and third-party verification to ensure transparency and accountability.",
    category: "batteries",
    tags: ["supply-chain", "due-diligence", "OECD", "transparency", "audit"],
  },
  {
    title: "Battery Carbon Footprint Calculation",
    content:
      "Starting from 2025, all EV and industrial batteries in the EU must declare their carbon footprint across the full lifecycle. The calculation follows the Product Environmental Footprint Category Rules (PEFCR) for rechargeable batteries, covering raw material extraction, manufacturing, transport, use phase, and end-of-life treatment. Ichnos Protocol automates carbon footprint calculation by collecting activity data from your production systems and applying the latest emission factors from recognized databases. The result is a verified carbon footprint declaration ready for inclusion in the battery passport.",
    category: "batteries",
    tags: ["carbon", "footprint", "PEFCR", "emissions", "lifecycle"],
  },
  {
    title: "Pricing and Plans",
    content:
      "Ichnos Protocol offers flexible pricing tailored to your production volume and compliance needs. Our Starter plan is designed for small manufacturers producing up to 1,000 batteries per year, including basic passport creation and compliance checks. The Professional plan supports up to 50,000 batteries per year with full API integration, automated data collection, and dedicated support. The Enterprise plan provides unlimited volume, custom integrations, on-premise deployment options, and a dedicated compliance team. Contact us for a personalized quote based on your specific requirements.",
    category: "battery_passport",
    tags: ["pricing", "plans", "starter", "enterprise", "quote"],
  },
  {
    title: "Technical Architecture",
    content:
      "The Ichnos Battery Passport platform is built on a modern cloud-native architecture. Data is stored in a combination of PostgreSQL for structured relational data and Firebase Firestore for document storage and real-time updates. The platform exposes RESTful APIs for integration with external systems and uses JWT-based authentication via Firebase Auth. The frontend is a responsive React application optimized for both desktop and mobile use. All data is encrypted at rest and in transit, and the platform is deployed on Vercel for high availability and global low-latency access.",
    category: "battery_passport",
    tags: ["architecture", "cloud", "API", "security", "platform"],
  },
];

async function seedKnowledgeBase() {
  const db = firebaseAdmin.firestore();
  const collection = db.collection(COLLECTION);
  const batch = db.batch();
  let created = 0;
  let skipped = 0;

  for (const doc of SEED_DOCUMENTS) {
    const existing = await collection
      .where("title", "==", doc.title)
      .limit(1)
      .get();

    if (!existing.empty) {
      console.log(`Skipping (already exists): ${doc.title}`);
      skipped++;
      continue;
    }

    const ref = collection.doc();
    batch.set(ref, {
      ...doc,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: "seed-script",
    });
    created++;
  }

  if (created > 0) {
    await batch.commit();
  }

  console.log(`Seed complete: ${created} created, ${skipped} skipped`);
}

seedKnowledgeBase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exit(1);
  });
