/**
 * Firestore Knowledge Base Deduplication Utility.
 *
 * Finds and removes duplicate documents in the knowledge_base collection.
 * Duplicates are detected by matching (created_by, content) pairs.
 * For each group of duplicates, the newest document is kept and the rest are deleted.
 *
 * Also backfills chunk_id and content_hash fields on legacy documents
 * that were ingested before the resumable pipeline was introduced.
 *
 * Usage:
 *   node scripts/utils/deduplicateFirestore.js --category transport_safety
 *   node scripts/utils/deduplicateFirestore.js --category transport_safety --dry-run
 *   node scripts/utils/deduplicateFirestore.js --source "markdown-extract:ADR_2025_Volume_1.md"
 *   node scripts/utils/deduplicateFirestore.js --all --migrate-created-by
 *   node scripts/utils/deduplicateFirestore.js --all
 */
import "dotenv/config";
import { createHash } from "crypto";
import { readdirSync, statSync } from "fs";
import { resolve, relative, join, basename } from "path";
import { fileURLToPath } from "url";
import firebaseAdmin from "../../src/config/firebase.js";

const COLLECTION = "knowledge_base";
const BATCH_LIMIT = 500;
const SERVER_ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const MARKDOWN_OUTPUT_DIR = join(
  SERVER_ROOT,
  "knowledge-base",
  "markdown_output",
);

function hashContent(content) {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

function buildDedupKey(data) {
  const sourceType = data.source_type || "unknown";
  const chunkId = data.chunk_id || "";
  const contentHash = hashContent(data.content || "");

  if (sourceType === "web") {
    const sourceUrl = (data.source_url || "").trim();
    const webIdentity = chunkId || `content:${contentHash}`;
    return `web::${sourceUrl || "unknown-url"}::${webIdentity}`;
  }

  const createdBy = data.created_by || "unknown";
  return `${sourceType}::${createdBy}::${chunkId || contentHash}`;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = {
    category: null,
    source: null,
    all: false,
    dryRun: false,
    migrateCreatedBy: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--category" && i + 1 < args.length) {
      result.category = args[++i];
    } else if (args[i] === "--source" && i + 1 < args.length) {
      result.source = args[++i];
    } else if (args[i] === "--all") {
      result.all = true;
    } else if (args[i] === "--dry-run") {
      result.dryRun = true;
    } else if (args[i] === "--migrate-created-by") {
      result.migrateCreatedBy = true;
    }
  }

  return result;
}

function toServerRelativePath(absolutePath) {
  return normalizePath(relative(SERVER_ROOT, absolutePath));
}

function walkMarkdownFiles(dirPath, files = []) {
  if (!statSync(dirPath).isDirectory()) return files;

  const entries = readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith(".")) continue;
      walkMarkdownFiles(absolutePath, files);
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(absolutePath);
    }
  }

  return files;
}

function buildMarkdownIndex() {
  const byRelativePath = new Map();
  const byBasename = new Map();

  if (
    !statSync(MARKDOWN_OUTPUT_DIR, { throwIfNoEntry: false })?.isDirectory?.()
  ) {
    return { byRelativePath, byBasename };
  }

  const markdownFiles = walkMarkdownFiles(MARKDOWN_OUTPUT_DIR);

  for (const absolutePath of markdownFiles) {
    const serverRelative = toServerRelativePath(absolutePath);
    const sourceId = `md:${serverRelative}`;
    byRelativePath.set(serverRelative, sourceId);

    const fileName = basename(serverRelative);
    if (!byBasename.has(fileName)) byBasename.set(fileName, []);
    byBasename.get(fileName).push(sourceId);
  }

  return { byRelativePath, byBasename };
}

function toPathCandidates(rawSource) {
  const cleaned = normalizePath(rawSource)
    .replace(/^legacy:/, "")
    .replace(/^\/+/, "")
    .replace(/^\.\//, "");

  const withoutPrefix = cleaned
    .replace(/^knowledge-base\/markdown_output\//, "")
    .replace(/^markdown_output\//, "");

  return [
    cleaned,
    withoutPrefix,
    `knowledge-base/markdown_output/${withoutPrefix}`,
  ];
}

function resolveLegacySourceId(createdBy, markdownIndex) {
  if (!createdBy || typeof createdBy !== "string") return null;

  const prefix = "markdown-extract:";
  const rawSource = createdBy.startsWith(prefix)
    ? createdBy.slice(prefix.length).trim()
    : createdBy.trim();

  if (!rawSource || rawSource.startsWith("md:")) return null;

  const candidates = toPathCandidates(rawSource);
  for (const candidate of candidates) {
    const sourceId = markdownIndex.byRelativePath.get(candidate);
    if (sourceId) return sourceId;
  }

  if (!rawSource.toLowerCase().endsWith(".md")) return null;

  const fileName = basename(rawSource);
  const matches = markdownIndex.byBasename.get(fileName) || [];
  if (matches.length === 1) return matches[0];

  return null;
}

function buildCreatedByMigrationUpdates(snapshot, markdownIndex) {
  const updates = [];
  const skipped = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    const createdBy = data.created_by || "";
    const sourceType = data.source_type || "";

    if (sourceType !== "markdown") return;
    if (!createdBy || createdBy.startsWith("markdown-extract:md:")) return;

    const resolvedSourceId = resolveLegacySourceId(createdBy, markdownIndex);
    if (!resolvedSourceId) {
      skipped.push(doc.id);
      return;
    }

    const nextCreatedBy = `markdown-extract:${resolvedSourceId}`;
    const payload = {
      created_by: nextCreatedBy,
      updated_at: new Date(),
    };

    const chunkId = data.chunk_id;
    if (typeof chunkId === "string") {
      const suffixMatch = chunkId.match(/::chunk_\d+$/);
      if (suffixMatch) {
        payload.chunk_id = `${resolvedSourceId}${suffixMatch[0]}`;
      }
    }

    updates.push({ id: doc.id, payload });
  });

  return { updates, skipped };
}

function normalizePath(pathValue) {
  return pathValue.replace(/\\/g, "/");
}

function extractSourceId(createdBy) {
  if (!createdBy) return "legacy:unknown";
  const prefix = "markdown-extract:";
  if (!createdBy.startsWith(prefix)) {
    return `legacy:${normalizePath(createdBy)}`;
  }

  const raw = createdBy.slice(prefix.length).trim();
  if (!raw) return "legacy:unknown";
  if (raw.startsWith("md:")) {
    return `md:${normalizePath(raw.slice(3))}`;
  }

  return `legacy:${normalizePath(raw)}`;
}

async function fetchDocuments(db, { category, source, all }) {
  let query = db.collection(COLLECTION);

  if (source) {
    query = query.where("created_by", "==", source);
  } else if (category) {
    query = query.where("category", "==", category);
  } else if (!all) {
    console.error("Error: specify --category, --source, or --all");
    process.exit(1);
  }

  console.log("Fetching documents...");
  const snapshot = await query.get();
  console.log(`  Found ${snapshot.size} documents`);
  return snapshot;
}

function findDuplicates(snapshot) {
  const groups = new Map();

  snapshot.forEach((doc) => {
    const data = doc.data();
    const key = buildDedupKey(data);

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push({
      id: doc.id,
      created_at: data.created_at?.toDate?.() || new Date(0),
      chunk_id: data.chunk_id || null,
    });
  });

  const toDelete = [];
  let dupGroups = 0;

  for (const [, docs] of groups) {
    if (docs.length <= 1) continue;
    dupGroups++;

    // Sort by created_at descending — keep the newest
    docs.sort((a, b) => b.created_at - a.created_at);
    const duplicates = docs.slice(1);
    toDelete.push(...duplicates.map((d) => d.id));
  }

  return { toDelete, dupGroups };
}

function findMissingChunkIds(snapshot) {
  // Group docs by created_by (source file)
  const bySource = new Map();

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.chunk_id) return; // Already has chunk_id
    const source = data.created_by || "unknown";
    if (!bySource.has(source)) bySource.set(source, []);
    bySource.get(source).push({
      id: doc.id,
      content: data.content || "",
      created_at: data.created_at?.toDate?.() || new Date(0),
    });
  });

  const updates = [];

  for (const [source, docs] of bySource) {
    // Sort by created_at ascending to assign stable indices
    docs.sort((a, b) => a.created_at - b.created_at);
    const sourceId = extractSourceId(source);

    for (let i = 0; i < docs.length; i++) {
      updates.push({
        id: docs[i].id,
        chunk_id: `${sourceId}::chunk_${i}`,
        content_hash: hashContent(docs[i].content),
      });
    }
  }

  return updates;
}

async function deleteDocs(db, docIds, dryRun) {
  if (dryRun) {
    console.log(`  [DRY RUN] Would delete ${docIds.length} documents`);
    return;
  }

  let batch = db.batch();
  let batchCount = 0;
  let deleted = 0;

  for (const docId of docIds) {
    batch.delete(db.collection(COLLECTION).doc(docId));
    batchCount++;
    deleted++;

    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
      console.log(`  Deleted ${deleted}/${docIds.length}...`);
    }
  }

  if (batchCount > 0) await batch.commit();
  console.log(`  Deleted ${deleted} duplicate documents`);
}

async function backfillChunkIds(db, updates, dryRun) {
  if (updates.length === 0) {
    console.log("  No documents need chunk_id backfill");
    return;
  }

  if (dryRun) {
    console.log(
      `  [DRY RUN] Would backfill chunk_id on ${updates.length} documents`,
    );
    return;
  }

  let batch = db.batch();
  let batchCount = 0;
  let updated = 0;

  for (const { id, chunk_id, content_hash } of updates) {
    batch.update(db.collection(COLLECTION).doc(id), {
      chunk_id,
      content_hash,
    });
    batchCount++;
    updated++;

    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
      console.log(`  Backfilled ${updated}/${updates.length}...`);
    }
  }

  if (batchCount > 0) await batch.commit();
  console.log(`  Backfilled chunk_id on ${updated} documents`);
}

async function migrateCreatedBy(db, snapshot, dryRun) {
  console.log("\n[Step 0] Migrating legacy markdown created_by...");
  const markdownIndex = buildMarkdownIndex();
  const { updates, skipped } = buildCreatedByMigrationUpdates(
    snapshot,
    markdownIndex,
  );

  if (updates.length === 0) {
    console.log("  No legacy markdown created_by values to migrate");
    return { migrated: 0, skipped: skipped.length };
  }

  if (dryRun) {
    console.log(
      `  [DRY RUN] Would migrate ${updates.length} documents (${skipped.length} unresolved legacy records)`,
    );
    return { migrated: updates.length, skipped: skipped.length };
  }

  let batch = db.batch();
  let batchCount = 0;
  let migrated = 0;

  for (const { id, payload } of updates) {
    batch.update(db.collection(COLLECTION).doc(id), payload);
    batchCount++;
    migrated++;

    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
      console.log(`  Migrated ${migrated}/${updates.length}...`);
    }
  }

  if (batchCount > 0) await batch.commit();
  console.log(
    `  Migrated ${migrated} legacy markdown records (${skipped.length} unresolved)`,
  );
  return { migrated, skipped: skipped.length };
}

async function main() {
  const opts = parseArgs(process.argv);
  const db = firebaseAdmin.firestore();
  if (opts.source && !opts.source.startsWith("markdown-extract:")) {
    opts.source = `markdown-extract:${opts.source}`;
  }

  console.log("=== Firestore Knowledge Base Deduplication ===");
  if (opts.dryRun) console.log("  MODE: dry-run (no changes will be made)");
  console.log();

  const snapshot = await fetchDocuments(db, opts);
  if (snapshot.empty) {
    console.log("  No documents found. Nothing to do.");
    process.exit(0);
  }

  let workingSnapshot = snapshot;
  let migratedCount = 0;
  let unresolvedLegacyCount = 0;

  if (opts.migrateCreatedBy) {
    const migrationResult = await migrateCreatedBy(
      db,
      workingSnapshot,
      opts.dryRun,
    );
    migratedCount = migrationResult.migrated;
    unresolvedLegacyCount = migrationResult.skipped;

    if (!opts.dryRun && migratedCount > 0) {
      workingSnapshot = await fetchDocuments(db, opts);
    }
  }

  // Step 1: Find and remove duplicates
  console.log("\n[Step 1] Finding duplicates...");
  const { toDelete, dupGroups } = findDuplicates(workingSnapshot);
  console.log(
    `  Found ${dupGroups} duplicate groups, ${toDelete.length} documents to remove`,
  );

  if (toDelete.length > 0) {
    await deleteDocs(db, toDelete, opts.dryRun);
  }

  // Step 2: Backfill chunk_id on surviving documents
  console.log("\n[Step 2] Backfilling chunk_id fields...");
  const updates = findMissingChunkIds(workingSnapshot);

  // Exclude docs that were just deleted
  const deletedSet = new Set(toDelete);
  const filteredUpdates = updates.filter((u) => !deletedSet.has(u.id));
  await backfillChunkIds(db, filteredUpdates, opts.dryRun);

  // Step 3: Summary
  console.log("\n=== Summary ===");
  console.log(`  Total documents scanned: ${workingSnapshot.size}`);
  console.log(`  Created_by migrated: ${migratedCount}`);
  console.log(`  Legacy unresolved: ${unresolvedLegacyCount}`);
  console.log(`  Duplicates removed: ${toDelete.length}`);
  console.log(`  Chunk IDs backfilled: ${filteredUpdates.length}`);
  console.log(
    `  Remaining documents: ${workingSnapshot.size - toDelete.length}`,
  );
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deduplication failed:", error.message);
    process.exit(1);
  });
