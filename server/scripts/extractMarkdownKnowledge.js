/**
 * Markdown Knowledge Extraction for RAG — Robust & Resumable.
 *
 * Parses Markdown files by heading hierarchy, generates metadata via xAI,
 * and writes documents to the Firestore knowledge_base collection.
 *
 * Features:
 *   - Chunk-level resume: skips already-ingested chunks via content hash
 *   - Deterministic chunk hashing: same content always produces the same hash
 *   - No duplicates: each chunk is identified by (source file + chunk index)
 *   - Atomic batches: writes committed in batches of BATCH_LIMIT
 *   - Continues on individual chunk failure after retries are exhausted
 *
 * Usage:
 *   node scripts/extractMarkdownKnowledge.js <file.md>
 *   node scripts/extractMarkdownKnowledge.js <file.md> --category batteries
 *   node scripts/extractMarkdownKnowledge.js <dir/> --batch
 *   node scripts/extractMarkdownKnowledge.js <file.md> --skip-existing
 */
import "dotenv/config";
import { createHash } from "crypto";
import { readFileSync, readdirSync, statSync } from "fs";
import { basename, join, extname, relative, resolve } from "path";
import { fileURLToPath } from "url";
import firebaseAdmin from "../src/config/firebase.js";
import { generateMetadata } from "./utils/generateMetadata.js";
import { chunkMarkdownByHeadings } from "./utils/chunkByHeadings.js";

const COLLECTION = "knowledge_base";
const MAX_WORDS = 300;
const BATCH_LIMIT = 500;
const SERVER_ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = {
    path: null,
    category: null,
    batch: false,
    skipExisting: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--category" && i + 1 < args.length) {
      result.category = args[++i];
    } else if (args[i] === "--batch") {
      result.batch = true;
    } else if (args[i] === "--skip-existing") {
      result.skipExisting = true;
    } else if (!args[i].startsWith("--")) {
      result.path = args[i];
    }
  }

  return result;
}

function normalizePath(pathValue) {
  return pathValue.replace(/\\/g, "/");
}

function buildSourceIdentifier(filePath) {
  const absolutePath = resolve(filePath);
  const relativePath = normalizePath(relative(SERVER_ROOT, absolutePath));
  return `md:${relativePath}`;
}

function buildChunkId(sourceId, chunkIndex) {
  return `${sourceId}::chunk_${chunkIndex}`;
}

function hashContent(content) {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

/**
 * Query Firestore for all chunk_ids already ingested for this file.
 * Returns a Set of chunk_id strings for fast lookup.
 */
async function fetchIngestedChunkIds(db, collection, sourceId) {
  const createdBy = `markdown-extract:${sourceId}`;
  const snapshot = await db
    .collection(collection)
    .where("created_by", "==", createdBy)
    .select("chunk_id")
    .get();

  const ids = new Set();
  snapshot.forEach((doc) => {
    const chunkId = doc.data().chunk_id;
    if (chunkId) ids.add(chunkId);
  });
  return ids;
}

async function processMarkdownFile(
  filePath,
  categoryOverride,
  collection,
  skipExisting = false,
) {
  const fileName = basename(filePath);
  const sourceId = buildSourceIdentifier(filePath);
  const createdBy = `markdown-extract:${sourceId}`;
  console.log(`\nProcessing: ${fileName}`);

  const content = readFileSync(filePath, "utf-8");
  const chunks = chunkMarkdownByHeadings(content, MAX_WORDS);
  console.log(`  Extracted ${chunks.length} chunks`);

  const db = firebaseAdmin.firestore();

  // Fetch already-ingested chunk IDs for chunk-level resume
  const ingestedIds = await fetchIngestedChunkIds(db, collection, sourceId);
  if (ingestedIds.size > 0) {
    console.log(`  Found ${ingestedIds.size} already-ingested chunks`);
  }

  // If --skip-existing and ALL chunks are already ingested, skip entirely
  if (skipExisting && ingestedIds.size >= chunks.length) {
    console.log(`  SKIP: all ${chunks.length} chunks already ingested`);
    return 0;
  }

  let batch = db.batch();
  let written = 0;
  let skipped = 0;
  let failed = 0;
  let batchCount = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkId = buildChunkId(sourceId, i);
    const contentHash = hashContent(chunk.content);

    // Skip already-ingested chunks
    if (ingestedIds.has(chunkId)) {
      skipped++;
      continue;
    }

    console.log(`  Chunk ${i + 1}/${chunks.length}: generating metadata...`);

    let metadata;
    try {
      metadata = await generateMetadata(chunk.content);
    } catch (error) {
      failed++;
      console.error(`    FAILED chunk ${i + 1}: ${error.message} — skipping`);
      continue;
    }

    const ref = db.collection(collection).doc();
    batch.set(ref, {
      title: metadata.title || chunk.headingText,
      content: chunk.content,
      category: categoryOverride || metadata.category,
      tags: metadata.tags,
      source_type: "markdown",
      heading_level: chunk.headingLevel,
      parent_section: chunk.parentSection,
      chunk_id: chunkId,
      content_hash: contentHash,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: createdBy,
    });

    written++;
    batchCount++;
    console.log(
      `    -> "${metadata.title}" [${categoryOverride || metadata.category}]`,
    );

    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
      console.log(`  Committed batch of ${BATCH_LIMIT} documents`);
    }
  }

  if (batchCount > 0) await batch.commit();

  console.log(
    `  Result: ${written} written, ${skipped} skipped, ${failed} failed (of ${chunks.length})`,
  );

  if (failed > 0) {
    throw new Error(
      `${failed} chunk(s) failed for ${fileName} — re-run to retry`,
    );
  }

  return written;
}

async function processDirectory(
  dirPath,
  categoryOverride,
  collection,
  skipExisting = false,
) {
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
      skipExisting,
    );
  }

  console.log(`\nBatch complete: ${files.length} files, ${totalChunks} chunks`);
}

function showUsage() {
  console.log(`Usage:
  node scripts/extractMarkdownKnowledge.js <file.md> [options]
  node scripts/extractMarkdownKnowledge.js <dir/> --batch [options]

Options:
  --category <name>    Override auto-detected category
  --batch              Process all .md files in directory
  --skip-existing      Skip files whose chunks are all already ingested`);
}

async function main() {
  const {
    path: targetPath,
    category,
    batch,
    skipExisting,
  } = parseArgs(process.argv);

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
    await processDirectory(targetPath, category, COLLECTION, skipExisting);
  } else {
    if (!stat.isFile()) {
      console.error("Error: path is not a file:", targetPath);
      process.exit(1);
    }
    await processMarkdownFile(targetPath, category, COLLECTION, skipExisting);
  }

  console.log("\nDone.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Extraction failed:", error.message);
    process.exit(1);
  });
