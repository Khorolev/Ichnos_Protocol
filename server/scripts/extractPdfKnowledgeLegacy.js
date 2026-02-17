/**
 * LEGACY: Simple PDF Text Extraction (pdfjs-dist)
 *
 * WARNING: This script is for SIMPLE, TEXT-ONLY PDFs only.
 * It does NOT preserve tables, equations, diagrams, or multi-column layouts.
 *
 * For complex PDFs with tables, equations, diagrams, or multi-column
 * layouts, use the Python Marker pipeline instead:
 *   1. python server/scripts/python/convertPdfToMarkdown.py --input <file.pdf> --output-dir ./markdown
 *   2. node server/scripts/extractMarkdownKnowledge.js ./markdown/<file>.md
 *
 * See server/scripts/README.md for complete pipeline documentation.
 *
 * Usage: node scripts/extractPdfKnowledgeLegacy.js <file1.pdf> [file2.pdf ...]
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { basename } from "path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import firebaseAdmin from "../src/config/firebase.js";
import { generateMetadata } from "./utils/generateMetadata.js";

const COLLECTION = "knowledge_base";
const MAX_WORDS = 200;
const MIN_WORDS = 20;

async function extractText(filePath) {
  const data = new Uint8Array(readFileSync(filePath));
  const pdf = await getDocument({ data, useSystemFonts: true }).promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(" ");
    pages.push(text);
  }

  return pages.join("\n\n");
}

function chunkText(text, maxWords = MAX_WORDS) {
  const paragraphs = text.split(/\n{2,}/);
  const chunks = [];
  let current = [];
  let wordCount = 0;

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;

    if (wordCount + words.length > maxWords && current.length > 0) {
      chunks.push(current.join("\n\n"));
      current = [];
      wordCount = 0;
    }

    current.push(para.trim());
    wordCount += words.length;
  }

  if (current.length > 0) chunks.push(current.join("\n\n"));

  return chunks.filter(
    (c) => c.split(/\s+/).filter(Boolean).length >= MIN_WORDS,
  );
}

async function processFile(filePath, collection) {
  const fileName = basename(filePath);
  console.log(`\nProcessing: ${fileName}`);

  const text = await extractText(filePath);
  const chunks = chunkText(text);
  console.log(`  Extracted ${chunks.length} chunks`);

  const db = firebaseAdmin.firestore();
  const batch = db.batch();
  let count = 0;

  for (let i = 0; i < chunks.length; i++) {
    console.log(`  Chunk ${i + 1}/${chunks.length}: generating metadata...`);
    const metadata = await generateMetadata(chunks[i]);

    const ref = db.collection(collection).doc();
    batch.set(ref, {
      title: metadata.title,
      content: chunks[i],
      category: metadata.category,
      tags: metadata.tags,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: `pdf-extract:${fileName}`,
    });
    count++;
    console.log(`    -> "${metadata.title}" [${metadata.category}]`);
  }

  if (count > 0) await batch.commit();
  console.log(`  Wrote ${count} documents from ${fileName}`);
}

async function main() {
  const files = process.argv.slice(2);

  if (files.length === 0) {
    console.error(
      "Usage: node scripts/extractPdfKnowledgeLegacy.js <file.pdf> [...]",
    );
    process.exit(1);
  }

  for (const file of files) {
    await processFile(file, COLLECTION);
  }

  console.log("\nDone.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Extraction failed:", error.message);
    process.exit(1);
  });
