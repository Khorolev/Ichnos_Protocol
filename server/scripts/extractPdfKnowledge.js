/**
 * PDF Knowledge Base Extractor
 *
 * Extracts text from PDF files, chunks it, generates metadata via xAI,
 * and writes documents to the Firestore knowledge_base collection.
 *
 * Usage: node scripts/extractPdfKnowledge.js <file1.pdf> [file2.pdf ...]
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { basename } from "path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import firebaseAdmin from "../src/config/firebase.js";

const COLLECTION = "knowledge_base";
const MAX_WORDS = 200;
const MIN_WORDS = 20;
const XAI_TIMEOUT_MS = 15000;

const VALID_CATEGORIES = [
  "battery_passport",
  "batteries",
  "homologation",
  "services",
  "general",
];

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

async function generateMetadata(content) {
  const endpoint =
    process.env.XAI_API_ENDPOINT ||
    "https://api.x.ai/v1/chat/completions";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), XAI_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-3-mini",
        messages: [
          {
            role: "user",
            content: `Analyze this text and return ONLY valid JSON (no markdown):
{
  "title": "concise title, max 10 words",
  "category": "one of: battery_passport, batteries, homologation, services, general",
  "tags": ["3-5", "lowercase", "keyword", "tags"]
}

Text: ${content.slice(0, 1500)}`,
          },
        ],
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`xAI API returned ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices[0].message.content.trim();
    const jsonStr = raw.replace(/```json?\s*/g, "").replace(/```/g, "");
    const parsed = JSON.parse(jsonStr);

    return {
      title: String(parsed.title || "Untitled").slice(0, 100),
      category: VALID_CATEGORIES.includes(parsed.category)
        ? parsed.category
        : "general",
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.slice(0, 5).map((t) => String(t).toLowerCase())
        : [],
    };
  } finally {
    clearTimeout(timer);
  }
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
      "Usage: node scripts/extractPdfKnowledge.js <file.pdf> [...]",
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
