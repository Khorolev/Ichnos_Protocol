/**
 * ============================================================================
 *  Orphan-User Cleanup Script
 * ============================================================================
 *
 * Targets rows in the `users` table that have NO matching row in
 * `user_profiles` (i.e. LEFT JOIN on `user_profiles.user_id = users.firebase_uid`
 * yields NULL). Such rows are created when `createUser` inserts into `users`
 * but the subsequent profile upsert never completes. These users cannot log in
 * and carry no downstream data (contact_requests / questions both FK to
 * `users.firebase_uid` with RESTRICT — orphan users, by definition, have none).
 *
 *  ⚠️  THIS OPERATION IS IRREVERSIBLE.
 *      Always run with `--dry-run` first and review the output before
 *      running with `--apply`. A dry-run makes NO database changes.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node server/scripts/cleanupOrphanUsers.js --dry-run
 *   DATABASE_URL="postgresql://..." node server/scripts/cleanupOrphanUsers.js --apply
 * ============================================================================
 */
import pg from "pg";
import { pathToFileURL } from "node:url";

const { Pool } = pg;

export async function findOrphanUsers(pool) {
  const result = await pool.query(
    `SELECT u.firebase_uid
       FROM users u
       LEFT JOIN user_profiles up ON up.user_id = u.firebase_uid
      WHERE up.user_id IS NULL`,
  );
  return { rows: result.rows, count: result.rows.length };
}

export async function deleteOrphanUsers(pool, firebaseUids) {
  if (!firebaseUids || firebaseUids.length === 0) {
    return { deletedCount: 0 };
  }
  const result = await pool.query(
    `DELETE FROM users WHERE firebase_uid = ANY($1)`,
    [firebaseUids],
  );
  return { deletedCount: result.rowCount };
}

export async function runAudit(pool) {
  const audit = await findOrphanUsers(pool);
  console.log(`[cleanup] Orphan users found: ${audit.count}`);
  if (audit.count > 0) {
    console.log("[cleanup] firebase_uid values:");
    for (const row of audit.rows) {
      console.log(`  - ${row.firebase_uid}`);
    }
  }
  return audit;
}

export async function runApply(pool, auditResult) {
  const audit = auditResult ?? (await findOrphanUsers(pool));
  if (!auditResult) {
    console.log(`[cleanup] Orphan users found: ${audit.count}`);
  }
  if (audit.count === 0) {
    console.log("[cleanup] Nothing to delete.");
    return { deletedCount: 0 };
  }
  const uids = audit.rows.map((row) => row.firebase_uid);
  console.log(
    `[cleanup] Deleting ${uids.length} audited firebase_uid value(s):`,
  );
  for (const uid of uids) {
    console.log(`  - ${uid}`);
  }
  const result = await deleteOrphanUsers(pool, uids);
  console.log(
    `[cleanup] Deleted ${result.deletedCount} orphan user row(s) (audited: ${uids.length}).`,
  );
  return result;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("[cleanup] DATABASE_URL is required");
    process.exit(1);
  }

  const apply = process.argv.includes("--apply");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const audit = await runAudit(pool);
    if (!apply) {
      console.log("[cleanup] DRY RUN — no rows deleted");
      process.exit(0);
    }
    await runApply(pool, audit);
    process.exit(0);
  } catch (err) {
    console.error(`[cleanup] Failed: ${err.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const invokedDirectly =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main();
}
