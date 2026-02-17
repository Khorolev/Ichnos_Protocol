/**
 * Markdown Knowledge Extraction for RAG.
 *
 * Parses Markdown files by heading hierarchy, generates metadata via xAI,
 * and writes documents to the Firestore knowledge_base collection.
 * Designed for Markdown output from the Python Marker conversion script.
 *
 * Usage:
 *   node scripts/extractMarkdownKnowledge.js <file.md>
 *   node scripts/extractMarkdownKnowledge.js <file.md> --category batteries
 *   node scripts/extractMarkdownKnowledge.js <dir/> --batch
 */
import "dotenv/config";
import { readFileSync, readdirSync, statSync } from "fs";
import { basename, join, extname } from "path";
import firebaseAdmin from "../src/config/firebase.js";
import { generateMetadata } from "./utils/generateMetadata.js";
import { chunkMarkdownByHeadings } from "./utils/chunkByHeadings.js";

const COLLECTION = "knowledge_base";
const MAX_WORDS = 300;
const BATCH_LIMIT = 500;

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = { path: null, category: null, batch: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--category" && i + 1 < args.length) {
      result.category = args[++i];
    } else if (args[i] === "--batch") {
      result.batch = true;
    } else if (!args[i].startsWith("--")) {
      result.path = args[i];
    }
  }

  return result;
}

async function processMarkdownFile(filePath, categoryOverride, collection) {
  const fileName = basename(filePath);
  console.log(`\nProcessing: ${fileName}`);

  const content = readFileSync(filePath, "utf-8");
  const chunks = chunkMarkdownByHeadings(content, MAX_WORDS);
  console.log(`  Extracted ${chunks.length} chunks`);

  const db = firebaseAdmin.firestore();
  let batch = db.batch();
  let count = 0;
  let batchCount = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`  Chunk ${i + 1}/${chunks.length}: generating metadata...`);
    const metadata = await generateMetadata(chunk.content);

    const ref = db.collection(collection).doc();
    batch.set(ref, {
      title: metadata.title || chunk.headingText,
      content: chunk.content,
      category: categoryOverride || metadata.category,
      tags: metadata.tags,
      source_type: "markdown",
      heading_level: chunk.headingLevel,
      parent_section: chunk.parentSection,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: `markdown-extract:${fileName}`,
    });

    count++;
    batchCount++;
    console.log(`    -> "${metadata.title}" [${categoryOverride || metadata.category}]`);

    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
      console.log(`  Committed batch of ${BATCH_LIMIT} documents`);
    }
  }

  if (batchCount > 0) await batch.commit();
  console.log(`  Wrote ${count} documents from ${fileName}`);
  return count;
}

async function processDirectory(dirPath, categoryOverride, collection) {
  const files = readdirSync(dirPath).filter(
    (f) => extname(f).toLowerCase() === ".md",
  );

  if (files.length === 0) {
    console.log("No .md files found in directory:", dirPath);
    return;
  }

  console.log(`Found ${files.length} Markdown file(s) in ${dirPath}`);
  let totalChunks = 0;

  for (const file of files) {
    const filePath = join(dirPath, file);
    totalChunks += await processMarkdownFile(
      filePath,
      categoryOverride,
      collection,
    );
  }

  console.log(
    `\nBatch complete: ${files.length} files, ${totalChunks} chunks`,
  );
}

function showUsage() {
  console.log(`Usage:
  node scripts/extractMarkdownKnowledge.js <file.md> [options]
  node scripts/extractMarkdownKnowledge.js <dir/> --batch [options]

Options:
  --category <name>  Override auto-detected category
  --batch            Process all .md files in directory`);
}

async function main() {
  const { path: targetPath, category, batch } = parseArgs(process.argv);

  if (!targetPath) {
    showUsage();
    process.exit(1);
  }

  const stat = statSync(targetPath);

  if (batch || stat.isDirectory()) {
    if (!stat.isDirectory()) {
      console.error("Error: --batch requires a directory path");
      process.exit(1);
    }
    await processDirectory(targetPath, category, COLLECTION);
  } else {
    if (!stat.isFile()) {
      console.error("Error: path is not a file:", targetPath);
      process.exit(1);
    }
    await processMarkdownFile(targetPath, category, COLLECTION);
  }

  console.log("\nDone.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Extraction failed:", error.message);
    process.exit(1);
  });
