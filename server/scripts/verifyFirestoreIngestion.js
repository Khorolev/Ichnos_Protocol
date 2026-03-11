/**
 * Firestore Ingestion Verification & Audit Tool
 *
 * Cross-category audit: counts Firestore docs, samples recent docs,
 * compares against .md files on disk, and reports gaps/anomalies.
 *
 * Usage:
 *   node scripts/verifyFirestoreIngestion.js --categories regulations,homologation
 *   node scripts/verifyFirestoreIngestion.js --all
 *   node scripts/verifyFirestoreIngestion.js --all --show-docs 5
 *   node scripts/verifyFirestoreIngestion.js --all --disk-check
 *   node scripts/verifyFirestoreIngestion.js --all --strict
 */
import "dotenv/config";
import { readdirSync, readFileSync, existsSync, statSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import firebaseAdmin from "../src/config/firebase.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MD_BASE = resolve(__dirname, "../knowledge-base/markdown_output");
const PDF_BASE = resolve(__dirname, "../knowledge-base/pdfs");
const PDF_MANIFEST = resolve(__dirname, "../knowledge-base/pdf-manifest.json");
const COLLECTION = "knowledge_base";
const MD_MIN_BYTES = 1000;
const MD_SAMPLE_SIZE = 3;
const STRUCTURE_PATTERN = /(Article|Chapter|Section|Reg)/i;

const CATEGORY_MAP = {
  regulations: {
    firestoreCategory: "regulations",
    subdirs: ["eu-battery-regulation"],
  },
  homologation: {
    firestoreCategory: "homologation",
    subdirs: ["unece-homologation"],
  },
  battery_passport: {
    firestoreCategory: "battery_passport",
    subdirs: ["battery-passport"],
  },
  standards: {
    firestoreCategory: "standards",
    subdirs: ["iec-iso-standards"],
  },
  functional_safety: {
    firestoreCategory: "functional_safety",
    legacyCategories: ["batteries"],
    sourceScoped: true,
    subdirs: ["functional-safety", "functional-safety/emergency-guides"],
    legacySourcePrefixes: [
      "markdown-extract:md:knowledge-base/markdown_output/functional-safety/nhtsa-emergency-response-guides/",
    ],
  },
  supply_chain: {
    firestoreCategory: "supply_chain",
    subdirs: ["supply-chain"],
  },
  transport_dangerous_goods: {
    firestoreCategory: "transport_dangerous_goods",
    legacyCategories: ["transport_safety"],
    subdirs: ["transport-safety", "transport-dangerous-goods"],
  },
  recycling_environmental: {
    firestoreCategory: "recycling_environmental",
    legacyCategories: ["recycling"],
    subdirs: ["recycling", "recycling-environment"],
  },
  africa_regulations: {
    firestoreCategory: "africa_regulations",
    legacyCategories: ["africa"],
    sourceScoped: true,
    subdirs: ["africa", "africa-regulations"],
  },
  asean_regulations: {
    firestoreCategory: "asean_regulations",
    legacyCategories: ["asean"],
    sourceScoped: true,
    subdirs: ["asean", "asean-regulations"],
  },
  battery_production: {
    firestoreCategory: "battery_production",
    subdirs: ["battery-production"],
  },
  battery_technology: {
    firestoreCategory: "battery_technology",
    subdirs: ["battery-technology"],
  },
  china_regulations: {
    firestoreCategory: "china_regulations",
    legacyCategories: ["china"],
    sourceScoped: true,
    subdirs: ["china", "china-regulations"],
  },
  eaeu_regulations: {
    firestoreCategory: "eaeu_regulations",
    legacyCategories: ["eaeu"],
    sourceScoped: true,
    subdirs: ["eaeu", "eaeu-regulations"],
  },
  middle_east_regulations: {
    firestoreCategory: "middle_east_regulations",
    legacyCategories: ["middle_east"],
    sourceScoped: true,
    subdirs: ["middle-east", "middle-east-regulations"],
  },
  global_market: {
    firestoreCategory: "global_market",
    subdirs: ["global-market"],
  },
};

function loadManifestData() {
  if (!existsSync(PDF_MANIFEST)) return {};

  try {
    return JSON.parse(readFileSync(PDF_MANIFEST, "utf-8"));
  } catch {
    return {};
  }
}

const MANIFEST_DATA = loadManifestData();
const EXPECTED_PDF_COUNTS = MANIFEST_DATA.expectedPdfCounts || {};
const STRICT_EXCLUSIONS = MANIFEST_DATA.strictExclusions || {};

function getStrictExclusions(subdirs) {
  const exclusions = [];

  for (const subdir of subdirs) {
    const entries = STRICT_EXCLUSIONS[subdir] || [];
    for (const entry of entries) {
      if (typeof entry === "string") {
        exclusions.push({
          subdir,
          file: entry,
          reason: "Excluded from strict completeness checks",
        });
        continue;
      }

      if (entry && entry.file) {
        exclusions.push({
          subdir,
          file: entry.file,
          reason: entry.reason || "Excluded from strict completeness checks",
        });
      }
    }
  }

  return exclusions;
}

function buildSourcePrefixes(subdirs, legacySourcePrefixes = []) {
  const canonical = subdirs.map(
    (subdir) => `markdown-extract:md:knowledge-base/markdown_output/${subdir}/`,
  );
  return [...canonical, ...legacySourcePrefixes];
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = {
    categories: [],
    all: false,
    showDocs: 3,
    diskCheck: false,
    strict: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--categories" && i + 1 < args.length) {
      result.categories = args[++i].split(",").map((c) => c.trim());
    } else if (args[i] === "--all") {
      result.all = true;
    } else if (args[i] === "--show-docs" && i + 1 < args.length) {
      result.showDocs = parseInt(args[++i], 10) || 3;
    } else if (args[i] === "--disk-check") {
      result.diskCheck = true;
    } else if (args[i] === "--strict") {
      result.strict = true;
    }
  }

  return result;
}

function isStrictExcludedPdf(subdir, fileName, strictExclusions = []) {
  return strictExclusions.some(
    (entry) => entry.subdir === subdir && entry.file === fileName,
  );
}

function matchesSourcePrefix(data, sourcePrefixes = []) {
  if (sourcePrefixes.length === 0) return true;
  const createdBy = data.created_by || "";
  return sourcePrefixes.some((prefix) => createdBy.startsWith(prefix));
}

async function fetchDocsForCategories(
  db,
  category,
  legacyCategories = [],
  sourcePrefixes = [],
) {
  const allCategories = [category, ...legacyCategories];
  const docs = [];

  for (const cat of allCategories) {
    const snapshot = await db
      .collection(COLLECTION)
      .where("category", "==", cat)
      .get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (matchesSourcePrefix(data, sourcePrefixes)) {
        docs.push(doc);
      }
    }
  }

  return docs;
}

async function countCategory(
  db,
  category,
  legacyCategories = [],
  sourcePrefixes = [],
) {
  const docs = await fetchDocsForCategories(
    db,
    category,
    legacyCategories,
    sourcePrefixes,
  );
  return docs.length;
}

async function sampleRecentDocs(
  db,
  category,
  n,
  legacyCategories = [],
  sourcePrefixes = [],
) {
  try {
    const allDocs = await fetchDocsForCategories(
      db,
      category,
      legacyCategories,
      sourcePrefixes,
    );

    const sorted = allDocs
      .map((doc) => ({
        doc,
        ts: getTimestamp(doc.data()) || new Date(0),
      }))
      .sort((a, b) => b.ts - a.ts)
      .slice(0, n);

    return {
      docs: formatDocs({ docs: sorted.map((s) => s.doc) }),
      warning: null,
    };
  } catch (err) {
    if (err.code === 9 || /index/i.test(err.message)) {
      const allDocs = await fetchDocsForCategories(
        db,
        category,
        legacyCategories,
        sourcePrefixes,
      );

      const sorted = allDocs
        .map((doc) => ({
          doc,
          ts: getTimestamp(doc.data()) || new Date(0),
        }))
        .sort((a, b) => b.ts - a.ts)
        .slice(0, n);

      return {
        docs: formatDocs({ docs: sorted.map((s) => s.doc) }),
        warning: "Composite index missing — sampled via in-memory sort",
      };
    }
    throw err;
  }
}

function getTimestamp(data) {
  const raw = data.created_at || data.createdAt;
  const date = raw?.toDate?.() || (raw instanceof Date ? raw : null);
  return date;
}

function formatDocs(snapshot) {
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const date = getTimestamp(data);
    return {
      title: data.title || data.created_by || "(untitled)",
      created_at: date ? date.toISOString().slice(0, 10) : "unknown",
      chunk_id: data.chunk_id || "(none)",
      source_url: data.source_url || "(none)",
    };
  });
}

function countMdFilesOnDisk(subdirs) {
  let total = 0;
  for (const subdir of subdirs) {
    const dir = join(MD_BASE, subdir);
    if (!existsSync(dir)) continue;
    total += readdirSync(dir).filter((f) => f.endsWith(".md")).length;
  }
  return total;
}

function checkStateMarkers(subdirs) {
  const missing = [];
  for (const subdir of subdirs) {
    const stateDir = join(MD_BASE, subdir, ".state");
    if (!existsSync(stateDir)) continue;

    const files = readdirSync(stateDir);
    const converted = new Set();
    const ingested = new Set();

    for (const f of files) {
      if (f.endsWith(".converted")) converted.add(f.replace(".converted", ""));
      if (f.endsWith(".ingested")) ingested.add(f.replace(".ingested", ""));
    }

    for (const name of converted) {
      if (!ingested.has(name)) missing.push(`${subdir}/${name}.md`);
    }
  }
  return missing;
}

function checkIngestionDelta(subdirs) {
  const pending = [];

  for (const subdir of subdirs) {
    const mdDir = join(MD_BASE, subdir);
    const stateDir = join(mdDir, ".state");
    if (!existsSync(mdDir) || !existsSync(stateDir)) continue;

    const ingested = new Set(
      readdirSync(stateDir)
        .filter((f) => f.endsWith(".ingested"))
        .map((f) => f.replace(".ingested", "")),
    );

    const mdFiles = readdirSync(mdDir).filter((f) => f.endsWith(".md"));
    for (const file of mdFiles) {
      const stem = file.replace(/\.md$/i, "");
      const filePath = join(mdDir, file);
      const size = statSync(filePath).size;

      if (size <= MD_MIN_BYTES) continue;
      if (!ingested.has(stem)) {
        pending.push(`${subdir}/${file}`);
      }
    }
  }

  return pending;
}

function countPdfsOnDisk(subdirs, strictExclusions = []) {
  let total = 0;
  for (const subdir of subdirs) {
    const dir = join(PDF_BASE, subdir);
    if (!existsSync(dir)) continue;

    const pdfFiles = readdirSync(dir).filter((f) => f.endsWith(".pdf"));
    for (const file of pdfFiles) {
      if (isStrictExcludedPdf(subdir, file, strictExclusions)) continue;
      total++;
    }
  }
  return total;
}

function countExcludedPdfsOnDisk(subdirs, strictExclusions = []) {
  let total = 0;
  for (const subdir of subdirs) {
    const dir = join(PDF_BASE, subdir);
    if (!existsSync(dir)) continue;

    const pdfFiles = readdirSync(dir).filter((f) => f.endsWith(".pdf"));
    for (const file of pdfFiles) {
      if (isStrictExcludedPdf(subdir, file, strictExclusions)) total++;
    }
  }
  return total;
}

function sumExpectedPdfCount(subdirs) {
  return subdirs.reduce((total, subdir) => {
    const expected = EXPECTED_PDF_COUNTS[subdir];
    return Number.isFinite(expected) ? total + expected : total;
  }, 0);
}

function computeEffectiveExpectedCount(subdirs, strictExclusions = []) {
  const expected = sumExpectedPdfCount(subdirs);
  if (expected === 0) return 0;
  return Math.max(0, expected - strictExclusions.length);
}

function hasExplicitExpectedCounts(subdirs) {
  return subdirs.every((subdir) =>
    Object.prototype.hasOwnProperty.call(EXPECTED_PDF_COUNTS, subdir),
  );
}

function checkMissingMdForPdfs(subdirs, strictExclusions = []) {
  const missing = [];

  for (const subdir of subdirs) {
    const pdfDir = join(PDF_BASE, subdir);
    const mdDir = join(MD_BASE, subdir);

    if (!existsSync(pdfDir) || !existsSync(mdDir)) continue;

    const mdSet = new Set(
      readdirSync(mdDir)
        .filter((f) => f.endsWith(".md"))
        .map((f) => f.replace(/\.md$/i, "")),
    );

    const pdfFiles = readdirSync(pdfDir).filter((f) => f.endsWith(".pdf"));
    for (const pdf of pdfFiles) {
      if (isStrictExcludedPdf(subdir, pdf, strictExclusions)) continue;
      const stem = pdf.replace(/\.pdf$/i, "");
      if (!mdSet.has(stem)) {
        missing.push(`${subdir}/${pdf}`);
      }
    }
  }

  return missing;
}

function readActiveUnresolvedFailures(subdirs) {
  const entries = [];

  for (const subdir of subdirs) {
    const unresolvedFile = join(
      MD_BASE,
      subdir,
      ".state",
      "unresolved_failures.txt",
    );
    if (!existsSync(unresolvedFile)) continue;

    const lines = readFileSync(unresolvedFile, "utf-8")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      entries.push(`${subdir}: ${line}`);
    }
  }

  return entries;
}

function readFailedPdfs(subdirs) {
  const entries = [];

  for (const subdir of subdirs) {
    const failedFile = join(MD_BASE, subdir, "failed_pdfs.txt");
    if (!existsSync(failedFile)) continue;

    const lines = readFileSync(failedFile, "utf-8")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      entries.push(`${subdir}: ${line}`);
    }
  }

  return entries;
}

function checkMdQuality(subdirs) {
  const issues = [];

  for (const subdir of subdirs) {
    const dir = join(MD_BASE, subdir);
    if (!existsSync(dir)) continue;

    const mdFiles = readdirSync(dir).filter((f) => f.endsWith(".md"));
    if (mdFiles.length === 0) continue;

    const sampled = mdFiles.slice(0, MD_SAMPLE_SIZE);

    for (const file of sampled) {
      const filePath = join(dir, file);
      const size = statSync(filePath).size;

      if (size < MD_MIN_BYTES) {
        issues.push(`${file}: only ${size} bytes (min ${MD_MIN_BYTES})`);
        continue;
      }

      const head = readFileSync(filePath, "utf-8").slice(0, 2000);
      if (!STRUCTURE_PATTERN.test(head)) {
        issues.push(`${file}: no structural markers in first 2000 chars`);
      }
    }
  }

  return issues;
}

async function countMissingSourceUrl(
  db,
  category,
  legacyCategories = [],
  sourcePrefixes = [],
) {
  const docs = await fetchDocsForCategories(
    db,
    category,
    legacyCategories,
    sourcePrefixes,
  );
  let missing = 0;
  let webTotal = 0;

  for (const doc of docs) {
    const data = doc.data();
    if (data.source_type !== "web") continue;
    webTotal++;
    const url = data.source_url;
    if (!url || url.trim() === "") missing++;
  }

  return { missing, webTotal };
}

async function checkMarkdownProvenance(
  db,
  category,
  legacyCategories = [],
  sourcePrefixes = [],
) {
  const docs = await fetchDocsForCategories(
    db,
    category,
    legacyCategories,
    sourcePrefixes,
  );

  let markdownTotal = 0;
  let invalid = 0;

  for (const doc of docs) {
    const data = doc.data();
    if (data.source_type !== "markdown") continue;
    markdownTotal++;

    const createdBy = (data.created_by || "").trim();
    const chunkId = (data.chunk_id || "").trim();
    const hasCreatedBy = createdBy.length > 0;
    const hasChunkId = chunkId.length > 0;
    const hasValidPrefix = createdBy.startsWith("markdown-extract:md:");

    let sourceAligned = false;
    if (hasCreatedBy && hasChunkId && hasValidPrefix) {
      const sourceId = createdBy.replace("markdown-extract:", "");
      sourceAligned = chunkId.startsWith(`${sourceId}::chunk_`);
    }

    if (!hasCreatedBy || !hasChunkId || !hasValidPrefix || !sourceAligned) {
      invalid++;
    }
  }

  return { invalid, markdownTotal };
}

function buildWarnings(
  firestoreCount,
  mdCount,
  category,
  subdirs,
  strict,
  strictExclusions = [],
) {
  const warnings = [];
  const primarySubdir = subdirs[0];
  const expected = sumExpectedPdfCount(subdirs);
  const effectiveExpected = computeEffectiveExpectedCount(
    subdirs,
    strictExclusions,
  );

  if (firestoreCount === 0 && mdCount > 0) {
    warnings.push(
      `Firestore empty but ${mdCount} .md files exist on disk.\n` +
        `    To reingest: bash server/scripts/runKnowledgePipeline.sh --pdf-subdir ${primarySubdir} --force-reingest`,
    );
  }

  const pdfCount = countPdfsOnDisk(subdirs, strictExclusions);
  const expectedBaseline = expected > 0 ? effectiveExpected : pdfCount;

  if (strict && expectedBaseline && mdCount < expectedBaseline) {
    const source = expected > 0 ? "manifest expected" : "PDFs on disk";
    warnings.push(
      `Only ${mdCount}/${expectedBaseline} .md files found (${source}).\n` +
        `    To convert missing: bash server/scripts/runKnowledgePipeline.sh --pdf-subdir ${primarySubdir}`,
    );
  }

  if (strict && strictExclusions.length > 0) {
    warnings.push(
      `Strict exclusion(s) applied (${strictExclusions.length}):\n` +
        strictExclusions
          .map(
            (entry) => `      ${entry.subdir}/${entry.file} — ${entry.reason}`,
          )
          .join("\n"),
    );
  }

  if (mdCount > 0 && firestoreCount > mdCount * 10) {
    const ratio = (firestoreCount / mdCount).toFixed(0);
    warnings.push(
      `Firestore count (${firestoreCount}) is ${ratio}x .md count (${mdCount}). Possible duplicates.\n` +
        `    To deduplicate: node server/scripts/utils/deduplicateFirestore.js --category ${category} --dry-run`,
    );
  }

  const notIngested = checkStateMarkers(subdirs);
  if (notIngested.length > 0) {
    warnings.push(
      `${notIngested.length} file(s) converted but not ingested: ${notIngested.slice(0, 5).join(", ")}`,
    );
  }

  const missingMd = checkMissingMdForPdfs(subdirs, strictExclusions);
  if (missingMd.length > 0) {
    warnings.push(
      `${missingMd.length} PDF(s) are missing converted markdown: ${missingMd.slice(0, 5).join(", ")}`,
    );
  }

  const ingestionDelta = checkIngestionDelta(subdirs);
  if (ingestionDelta.length > 0) {
    warnings.push(
      `${ingestionDelta.length} ingestible .md file(s) are not marked ingested: ${ingestionDelta.slice(0, 5).join(", ")}`,
    );
  }

  const unresolvedFailures = readActiveUnresolvedFailures(subdirs);
  if (unresolvedFailures.length > 0) {
    warnings.push(
      `${unresolvedFailures.length} active unresolved pipeline failure(s) (.state/unresolved_failures.txt):\n` +
        unresolvedFailures.map((l) => `      ${l}`).join("\n"),
    );
  }

  const failedPdfs = readFailedPdfs(subdirs);
  if (failedPdfs.length > 0) {
    warnings.push(
      `${failedPdfs.length} failed PDF conversion(s) (failed_pdfs.txt):\n` +
        failedPdfs.map((l) => `      ${l}`).join("\n"),
    );
  }

  const mdIssues = checkMdQuality(subdirs);
  if (mdIssues.length > 0) {
    warnings.push(
      `${mdIssues.length} markdown quality issue(s):\n` +
        mdIssues.map((i) => `      ${i}`).join("\n"),
    );
  }

  return warnings;
}

function printCategoryReport(category, subdirs, data) {
  const {
    firestoreCount,
    mdCount,
    samples,
    warnings,
    integrityFailures,
    diskCheck,
    strict,
    missingSourceUrlCount,
    webDocTotal,
    invalidMarkdownProvenance,
    markdownDocTotal,
    strictExclusions,
  } = data;
  const subdirLabel = subdirs.join(", ");

  console.log(`Category: ${category} (subdirs: ${subdirLabel})`);
  console.log(`  Firestore docs:    ${firestoreCount}`);

  if (diskCheck) {
    console.log(`  .md files on disk: ${mdCount}`);
    if (mdCount > 0 && firestoreCount > 0) {
      const avg = (firestoreCount / mdCount).toFixed(1);
      console.log(`  Avg chunks/file:   ${avg}`);
    }
  }

  if (strict) {
    const pdfCount = countPdfsOnDisk(subdirs, strictExclusions);
    const excludedOnDisk = countExcludedPdfsOnDisk(subdirs, strictExclusions);
    const expectedCount = sumExpectedPdfCount(subdirs);
    const effectiveExpectedCount = computeEffectiveExpectedCount(
      subdirs,
      strictExclusions,
    );
    const hasExpected = hasExplicitExpectedCounts(subdirs);
    if (pdfCount > 0) {
      console.log(`  PDFs on disk:      ${pdfCount}`);
    }
    if (excludedOnDisk > 0) {
      console.log(`  PDFs excluded:     ${excludedOnDisk} (strict exclusions)`);
    }
    if (hasExpected) {
      console.log(
        `  Expected PDFs:     ${effectiveExpectedCount} (manifest ${expectedCount} minus ${strictExclusions.length} exclusions)`,
      );
    }
  }

  if (typeof missingSourceUrlCount === "number") {
    console.log(
      `  Web docs missing source_url: ${missingSourceUrlCount}/${webDocTotal}`,
    );
  }

  if (typeof invalidMarkdownProvenance === "number") {
    console.log(
      `  Markdown provenance invalid: ${invalidMarkdownProvenance}/${markdownDocTotal}`,
    );
  }

  if (samples.length > 0) {
    console.log(`  Sample docs (${samples.length} most recent):`);
    for (const s of samples) {
      const title =
        s.title.length > 50 ? s.title.slice(0, 47) + "..." : s.title;
      const urlLabel =
        s.source_url.length > 40
          ? s.source_url.slice(0, 37) + "..."
          : s.source_url;
      console.log(
        `    - "${title}"  [${s.chunk_id}]  ${s.created_at}  url:${urlLabel}`,
      );
    }
  }

  if (warnings.length > 0) {
    console.log("  Warnings:");
    for (const w of warnings) console.log(`    ⚠ ${w}`);
  } else {
    console.log("  Warnings: none");
  }

  if (integrityFailures.length > 0) {
    console.log("  Integrity failures:");
    for (const f of integrityFailures) console.log(`    ✗ ${f}`);
  }

  const ok = integrityFailures.length === 0;
  console.log(`  Status: ${ok ? "✅ OK" : "❌ FAILED"}`);
  console.log();
}

function runIntegrityChecks(
  firestoreCount,
  mdCount,
  subdirs,
  strict,
  missingSourceUrlCount = 0,
  invalidMarkdownProvenance = 0,
  strictExclusions = [],
) {
  const failures = [];

  const expected = sumExpectedPdfCount(subdirs);
  const effectiveExpected = computeEffectiveExpectedCount(
    subdirs,
    strictExclusions,
  );
  const hasExpected = hasExplicitExpectedCounts(subdirs);
  const pdfCount = countPdfsOnDisk(subdirs, strictExclusions);
  const expectedZeroResources =
    strict &&
    hasExpected &&
    effectiveExpected === 0 &&
    pdfCount === 0 &&
    mdCount === 0 &&
    firestoreCount === 0;

  if (firestoreCount === 0 && !expectedZeroResources) {
    failures.push("Firestore has 0 documents");
  }

  const notIngested = checkStateMarkers(subdirs);
  if (notIngested.length > 0) {
    failures.push(
      `${notIngested.length} file(s) converted but not ingested: ${notIngested.slice(0, 5).join(", ")}`,
    );
  }

  const missingMd = checkMissingMdForPdfs(subdirs, strictExclusions);
  if (missingMd.length > 0) {
    failures.push(
      `${missingMd.length} PDF(s) missing corresponding .md conversion`,
    );
  }

  const ingestionDelta = checkIngestionDelta(subdirs);
  if (ingestionDelta.length > 0) {
    failures.push(
      `${ingestionDelta.length} ingestible .md file(s) are missing .ingested markers`,
    );
  }

  const unresolvedFailures = readActiveUnresolvedFailures(subdirs);
  if (unresolvedFailures.length > 0) {
    failures.push(
      `${unresolvedFailures.length} active unresolved pipeline failure(s) (.state/unresolved_failures.txt)`,
    );
  }

  const failedPdfs = readFailedPdfs(subdirs);
  if (failedPdfs.length > 0) {
    failures.push(
      `${failedPdfs.length} failed PDF conversion(s) (failed_pdfs.txt)`,
    );
  }

  const strictExpected = strict && expected > 0 ? effectiveExpected : null;

  if (strictExpected && mdCount < strictExpected) {
    failures.push(
      `Markdown count (${mdCount}) does not match expected (${strictExpected}) — ` +
        "manifest expected",
    );
  }

  if (pdfCount > 0 && mdCount > 0 && mdCount < pdfCount) {
    failures.push(
      `Only ${mdCount}/${pdfCount} PDFs have corresponding .md files`,
    );
  }

  if (strict && missingSourceUrlCount > 0) {
    failures.push(
      `${missingSourceUrlCount} web-ingested doc(s) missing source_url`,
    );
  }

  if (strict && invalidMarkdownProvenance > 0) {
    failures.push(
      `${invalidMarkdownProvenance} markdown doc(s) violate provenance contract (created_by/chunk_id format or prefix alignment)`,
    );
  }

  return failures;
}

async function auditCategory(db, category, opts) {
  const mapping = CATEGORY_MAP[category];
  if (!mapping) {
    console.log(`Category: ${category}`);
    console.log(`  ⚠ Unknown category — no mapping found`);
    console.log(`  Status: ❌ UNKNOWN\n`);
    return { firestoreCount: 0, ok: false };
  }

  const {
    firestoreCategory,
    subdirs,
    legacyCategories = [],
    sourceScoped = false,
    legacySourcePrefixes = [],
  } = mapping;
  const sourcePrefixes = sourceScoped
    ? buildSourcePrefixes(subdirs, legacySourcePrefixes)
    : [];
  const strictExclusions = opts.strict ? getStrictExclusions(subdirs) : [];
  const firestoreCount = await countCategory(
    db,
    firestoreCategory,
    legacyCategories,
    sourcePrefixes,
  );
  const { docs: samples, warning: sampleWarning } = await sampleRecentDocs(
    db,
    firestoreCategory,
    opts.showDocs,
    legacyCategories,
    sourcePrefixes,
  );
  const mdCount =
    opts.diskCheck || opts.strict ? countMdFilesOnDisk(subdirs) : 0;
  const { missing: missingSourceUrlCount, webTotal: webDocTotal } =
    await countMissingSourceUrl(
      db,
      firestoreCategory,
      legacyCategories,
      sourcePrefixes,
    );
  const {
    invalid: invalidMarkdownProvenance,
    markdownTotal: markdownDocTotal,
  } = await checkMarkdownProvenance(
    db,
    firestoreCategory,
    legacyCategories,
    sourcePrefixes,
  );
  const warnings = buildWarnings(
    firestoreCount,
    mdCount,
    category,
    subdirs,
    opts.strict,
    strictExclusions,
  );
  if (sampleWarning) warnings.push(sampleWarning);

  const integrityFailures = runIntegrityChecks(
    firestoreCount,
    mdCount,
    subdirs,
    opts.strict,
    missingSourceUrlCount,
    invalidMarkdownProvenance,
    strictExclusions,
  );

  printCategoryReport(category, subdirs, {
    firestoreCount,
    mdCount,
    samples,
    warnings,
    integrityFailures,
    diskCheck: opts.diskCheck || opts.strict,
    strict: opts.strict,
    missingSourceUrlCount,
    webDocTotal,
    invalidMarkdownProvenance,
    markdownDocTotal,
    strictExclusions,
  });

  const ok = integrityFailures.length === 0;
  return { firestoreCount, ok };
}

async function main() {
  const opts = parseArgs(process.argv);

  if (!opts.all && opts.categories.length === 0) {
    console.error("Usage:");
    console.error(
      "  node scripts/verifyFirestoreIngestion.js --categories regulations,homologation",
    );
    console.error("  node scripts/verifyFirestoreIngestion.js --all");
    console.error(
      "  node scripts/verifyFirestoreIngestion.js --all --show-docs 5 --disk-check --strict",
    );
    process.exit(1);
  }

  const categories = opts.all ? Object.keys(CATEGORY_MAP) : opts.categories;
  const db = firebaseAdmin.firestore();

  console.log("=== Firestore Ingestion Audit ===\n");

  let totalDocs = 0;
  let totalCategories = 0;
  let failedCategories = 0;

  for (const category of categories) {
    totalCategories++;
    const { firestoreCount, ok } = await auditCategory(db, category, opts);
    totalDocs += firestoreCount;
    if (!ok) failedCategories++;
  }

  console.log("=== Summary ===");
  console.log(`  Categories audited: ${totalCategories}`);
  console.log(`  Total Firestore docs: ${totalDocs}`);
  console.log(`  Failed categories: ${failedCategories}`);

  if (failedCategories > 0) {
    console.log(
      `\n  ❌ ${failedCategories} category(ies) failed integrity checks.`,
    );
  } else {
    console.log("\n  ✅ All categories passed integrity checks.");
  }

  console.log();
  process.exit(failedCategories > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Audit failed:", error.message);
  process.exit(1);
});
