/**
 * E2E Seed Routes
 *
 * Provides a POST /seed endpoint for E2E test data seeding.
 * Guarded by VERCEL_ENV !== 'production' and a Bearer token.
 * Uses its own pg.Pool (not the shared app pool) to avoid side effects.
 */
import { Router } from "express";
import pg from "pg";

const { Pool } = pg;

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

async function upsertContactRequest(pool, uid) {
  const existing = await pool.query(
    "SELECT id FROM contact_requests WHERE user_id = $1 LIMIT 1",
    [uid],
  );

  let requestId;
  if (existing.rows.length > 0) {
    requestId = existing.rows[0].id;
  } else {
    const res = await pool.query(
      `INSERT INTO contact_requests
         (user_id, status, contact_consent_timestamp, contact_consent_version)
       VALUES ($1, 'new', NOW(), 'v1') RETURNING id`,
      [uid],
    );
    requestId = res.rows[0].id;
  }

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

function validateEnvironment() {
  if (process.env.VERCEL_ENV === "production") {
    return { status: 403, error: "Forbidden", message: "Not available in production" };
  }
  return null;
}

function validateToken(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token || token !== process.env.E2E_SEED_TOKEN) {
    return { status: 403, error: "Forbidden", message: "Invalid or missing token" };
  }
  return null;
}

function validateBody(req) {
  const { accounts } = req.body;
  if (!Array.isArray(accounts) || accounts.length === 0) {
    return { status: 400, error: "Bad Request", message: "accounts array is required and must not be empty" };
  }
  return null;
}

async function seedAccounts(pool, accounts) {
  for (const acct of accounts) {
    const { uid, firstName, lastName, email, seedContactRequest } = acct;
    await upsertUser(pool, uid, firstName, lastName, email);
    if (seedContactRequest) {
      await upsertContactRequest(pool, uid);
    }
  }
}

async function seedHandler(req, res) {
  const envErr = validateEnvironment();
  if (envErr) return res.status(envErr.status).json({ error: envErr.error, message: envErr.message });

  const tokenErr = validateToken(req);
  if (tokenErr) return res.status(tokenErr.status).json({ error: tokenErr.error, message: tokenErr.message });

  const bodyErr = validateBody(req);
  if (bodyErr) return res.status(bodyErr.status).json({ error: bodyErr.error, message: bodyErr.message });

  let pool;
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await seedAccounts(pool, req.body.accounts);
    return res.status(200).json({ data: { seeded: req.body.accounts.length }, message: "E2E seed complete" });
  } catch (err) {
    return res.status(500).json({ error: "Seed failed", message: err.message });
  } finally {
    if (pool) await pool.end();
  }
}

const router = Router();
router.post("/seed", seedHandler);

export default router;
