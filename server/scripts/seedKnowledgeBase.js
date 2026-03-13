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
import { SEED_DOCUMENTS } from "./helpers/knowledgeBaseDocs.js";

const COLLECTION = "knowledge_base";

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
