/**
 * Auto-seed E2E test data on preview startup.
 *
 * When the server starts in a Vercel preview environment (VERCEL_ENV === 'preview')
 * and the required E2E account env vars are present, this module idempotently
 * upserts test users and contact requests into the preview database.
 *
 * Called fire-and-forget from app.js — does not block request handling.
 * Env vars are read inside the function body (not at module scope) so the
 * module can be imported safely in any environment.
 */
import pg from "pg";

const { Pool } = pg;

const REQUIRED_VARS = ["DATABASE_URL", "E2E_ADMIN_EMAIL", "E2E_ADMIN_UID"];

export const seedStatus = { seeded: false, error: null };

async function upsertUser(pool, uid, firstName, lastName, email) {
  await pool.query(
    `INSERT INTO users (firebase_uid)
     VALUES ($1)
     ON CONFLICT (firebase_uid) DO UPDATE SET deleted_at = NULL`,
    [uid],
  );
  await pool.query(
    `INSERT INTO user_profiles (user_id, name, surname, email, company)
     VALUES ($1, $2, $3, $4, $5) ON CONFLICT (user_id) DO NOTHING`,
    [uid, firstName, lastName, email, "E2E Corp"],
  );
}

async function findOrCreateRequest(pool, uid) {
  const existing = await pool.query(
    "SELECT id FROM contact_requests WHERE user_id = $1 LIMIT 1",
    [uid],
  );
  if (existing.rows.length > 0) return existing.rows[0].id;

  const res = await pool.query(
    `INSERT INTO contact_requests
       (user_id, status, contact_consent_timestamp, contact_consent_version)
     VALUES ($1, 'new', NOW(), 'v1') RETURNING id`,
    [uid],
  );
  return res.rows[0].id;
}

async function upsertQuestion(pool, uid, requestId) {
  await pool.query(
    `INSERT INTO questions (user_id, contact_request_id, question, source)
     SELECT $1::varchar, $2::integer, 'E2E test question', 'form'
     WHERE NOT EXISTS (
       SELECT 1 FROM questions
       WHERE user_id = $1::varchar AND contact_request_id = $2::integer
         AND question = 'E2E test question'
     )`,
    [uid, requestId],
  );
}

async function upsertContactRequest(pool, uid) {
  const requestId = await findOrCreateRequest(pool, uid);
  await upsertQuestion(pool, uid, requestId);
}

async function seedOptionalUser(pool) {
  if (!process.env.E2E_USER_UID || !process.env.E2E_USER_EMAIL) return;
  await upsertUser(pool, process.env.E2E_USER_UID, "E2E", "User", process.env.E2E_USER_EMAIL);
}

async function seedAdmin(pool) {
  await upsertUser(pool, process.env.E2E_ADMIN_UID, "E2E", "Admin", process.env.E2E_ADMIN_EMAIL);
  await upsertContactRequest(pool, process.env.E2E_ADMIN_UID);
}

async function seedOptionalSuperAdmin(pool) {
  if (!process.env.E2E_SUPER_ADMIN_UID || !process.env.E2E_SUPER_ADMIN_EMAIL) return;
  await upsertUser(
    pool, process.env.E2E_SUPER_ADMIN_UID, "E2E", "SuperAdmin", process.env.E2E_SUPER_ADMIN_EMAIL,
  );
  await upsertContactRequest(pool, process.env.E2E_SUPER_ADMIN_UID);
}

async function closePool(pool) {
  try {
    await pool.end();
  } catch (err) {
    console.error("[e2e-seed] Pool close failed:", err.message);
  }
}

export async function seedE2EOnPreview() {
  seedStatus.error = null;

  if (process.env.VERCEL_ENV !== "preview") {
    seedStatus.seeded = true;
    return;
  }

  const missing = REQUIRED_VARS.filter(
    (key) => typeof process.env[key] !== "string" || process.env[key].length === 0,
  );
  if (missing.length > 0) {
    const msg = `Preview environment missing required seed vars: ${missing.join(", ")}`;
    seedStatus.error = msg;
    console.error(`[e2e-seed] ${msg}`);
    return;
  }

  console.log("[e2e-seed] Preview environment detected — seeding E2E data...");

  // Retry logic: Neon ephemeral branch compute endpoints start suspended
  // (scale-to-zero). The first connection attempt may fail with "Authentication
  // timed out" or "Connection terminated unexpectedly" while Neon wakes up the
  // compute endpoint. Retrying after a short delay resolves this.
  const MAX_RETRIES = 5;
  const RETRY_DELAY_MS = 5000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let pool;
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 15000,
      });
      await seedOptionalUser(pool);
      await seedAdmin(pool);
      await seedOptionalSuperAdmin(pool);
      seedStatus.seeded = true;
      seedStatus.error = null;
      console.log("[e2e-seed] E2E seed complete");
      return;
    } catch (err) {
      const isTransient =
        err.message.includes("timed out") ||
        err.message.includes("terminated unexpectedly") ||
        err.message.includes("Connection refused") ||
        err.message.includes("ECONNRESET");

      if (isTransient && attempt < MAX_RETRIES) {
        console.warn(
          `[e2e-seed] Attempt ${attempt}/${MAX_RETRIES} failed: ${err.message} — retrying in ${RETRY_DELAY_MS / 1000}s...`,
        );
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      } else {
        seedStatus.error = err.message;
        console.error(
          `[e2e-seed] E2E seed failed after ${attempt} attempt(s): ${err.message}`,
        );
      }
    } finally {
      if (pool) await closePool(pool);
    }
  }
}
