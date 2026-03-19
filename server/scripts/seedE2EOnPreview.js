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

function shouldSeed() {
  if (process.env.VERCEL_ENV !== "preview") return false;
  return REQUIRED_VARS.every(
    (key) => typeof process.env[key] === "string" && process.env[key].length > 0,
  );
}

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
  if (!shouldSeed()) return;

  console.log("[e2e-seed] Preview environment detected — seeding E2E data...");
  let pool;

  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await seedOptionalUser(pool);
    await seedAdmin(pool);
    await seedOptionalSuperAdmin(pool);
    console.log("[e2e-seed] E2E seed complete");
  } catch (err) {
    console.error("[e2e-seed] E2E seed failed:", err.message);
  } finally {
    if (pool) await closePool(pool);
  }
}
