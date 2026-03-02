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
 *   node scripts/utils/deduplicateFirestore.js --all
 */
import "dotenv/config";
import { createHash } from "crypto";
import firebaseAdmin from "../../src/config/firebase.js";

const COLLECTION = "knowledge_base";
const BATCH_LIMIT = 500;

function hashContent(content) {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = { category: null, source: null, all: false, dryRun: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--category" && i + 1 < args.length) {
      result.category = args[++i];
    } else if (args[i] === "--source" && i + 1 < args.length) {
      result.source = args[++i];
    } else if (args[i] === "--all") {
      result.all = true;
    } else if (args[i] === "--dry-run") {
      result.dryRun = true;
    }
  }

  return result;
}

async function fetchDocuments(db, { category, source, all }) {
  let query = db.collection(COLLECTION);

  if (source) {
    query = query.where("created_by", "==", source);
  } else if (category) {
    query = query.where("category", "==", category);
  } else if (!all) {
    console.error(
      "Error: specify --category, --source, or --all",
    );
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
    const key = `${data.created_by || "unknown"}::${hashContent(data.content || "")}`;

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
    const fileName = source.replace("markdown-extract:", "");

    for (let i = 0; i < docs.length; i++) {
      updates.push({
        id: docs[i].id,
        chunk_id: `${fileName}::chunk_${i}`,
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

async function main() {
  const opts = parseArgs(process.argv);
  const db = firebaseAdmin.firestore();

  console.log("=== Firestore Knowledge Base Deduplication ===");
  if (opts.dryRun) console.log("  MODE: dry-run (no changes will be made)");
  console.log();

  const snapshot = await fetchDocuments(db, opts);
  if (snapshot.empty) {
    console.log("  No documents found. Nothing to do.");
    process.exit(0);
  }

  // Step 1: Find and remove duplicates
  console.log("\n[Step 1] Finding duplicates...");
  const { toDelete, dupGroups } = findDuplicates(snapshot);
  console.log(
    `  Found ${dupGroups} duplicate groups, ${toDelete.length} documents to remove`,
  );

  if (toDelete.length > 0) {
    await deleteDocs(db, toDelete, opts.dryRun);
  }

  // Step 2: Backfill chunk_id on surviving documents
  console.log("\n[Step 2] Backfilling chunk_id fields...");
  const updates = findMissingChunkIds(snapshot);

  // Exclude docs that were just deleted
  const deletedSet = new Set(toDelete);
  const filteredUpdates = updates.filter((u) => !deletedSet.has(u.id));
  await backfillChunkIds(db, filteredUpdates, opts.dryRun);

  // Step 3: Summary
  console.log("\n=== Summary ===");
  console.log(`  Total documents scanned: ${snapshot.size}`);
  console.log(`  Duplicates removed: ${toDelete.length}`);
  console.log(`  Chunk IDs backfilled: ${filteredUpdates.length}`);
  console.log(`  Remaining documents: ${snapshot.size - toDelete.length}`);
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deduplication failed:", error.message);
    process.exit(1);
  });
