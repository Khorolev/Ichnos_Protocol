/**
 * Auto-seed E2E test data on preview startup.
 *
 * When the server starts in a Vercel preview environment (VERCEL_ENV === 'preview')
 * and the required E2E account env vars are present, this module idempotently
 * upserts test users and contact requests into the preview database.
 *
 * IMPORTANT — Vercel serverless lifecycle:
 * On Vercel, async work that outlives the HTTP response is killed. A fire-and-
 * forget call like `seedE2EOnPreview()` at module scope gets interrupted when
 * Vercel terminates the function after sending the response.
 *
 * Solution: the seed is exposed as a lazy singleton promise via `ensureSeeded()`.
 * The health endpoint `await`s this promise, keeping the function alive until
 * the seed completes. The promise is created once and shared across requests —
 * subsequent callers get the same (already-resolved) promise.
 */
import pg from "pg";

const { Pool } = pg;

const REQUIRED_VARS = ["DATABASE_URL", "E2E_ADMIN_EMAIL", "E2E_ADMIN_UID"];

export const seedStatus = { seeded: false, error: null, attempts: 0 };

/** Singleton promise — created on first call, shared across all callers. */
let seedPromise = null;

/**
 * Returns a promise that resolves when seeding is complete (or skipped).
 * Safe to call multiple times — only runs the seed once.
 */
export function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = seedE2EOnPreview();
  }
  return seedPromise;
}

/**
 * Reset seed state for testing. Clears the singleton promise and status
 * so each test starts fresh.
 */
export function resetSeedState() {
  seedPromise = null;
  seedStatus.seeded = false;
  seedStatus.error = null;
  seedStatus.attempts = 0;
}

/**
 * Parse the DATABASE_URL to extract host info for diagnostics.
 * Never logs credentials — only host, port, and database name.
 */
function logConnectionInfo(dbUrl) {
  try {
    const u = new URL(dbUrl);
    console.log(
      `[e2e-seed] DB target: host=${u.hostname}, port=${u.port || 5432}, ` +
        `db=${u.pathname.slice(1)}, user=${u.username}, ssl=${u.searchParams.get("sslmode") || "default"}`,
    );
  } catch {
    console.error("[e2e-seed] DATABASE_URL is not a valid URL");
  }
}

/**
 * Build Pool configuration from DATABASE_URL.
 * Neon requires SSL — ensure it's enabled even if the connection string
 * doesn't explicitly set sslmode.
 */
function buildPoolConfig(dbUrl) {
  const config = {
    connectionString: dbUrl,
    connectionTimeoutMillis: 15000,
    max: 2,
  };

  // Neon always requires SSL. If sslmode is in the URL, pg handles it.
  // If not, explicitly enable SSL to avoid "Connection terminated" errors.
  if (!dbUrl.includes("sslmode=")) {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
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

/**
 * Test basic connectivity with a simple SELECT 1 before running the full seed.
 * This isolates connection issues from seed logic errors.
 */
async function testConnection(pool) {
  const { rows } = await pool.query("SELECT 1 AS ok");
  return rows[0]?.ok === 1;
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

  const dbUrl = process.env.DATABASE_URL;
  console.log("[e2e-seed] Preview environment detected — seeding E2E data...");
  logConnectionInfo(dbUrl);

  // Retry logic: Neon ephemeral branch compute endpoints may start suspended
  // (scale-to-zero). The first connection attempt can fail with:
  //   - "Connection terminated due to connection timeout" (compute waking up)
  //   - "Authentication timed out" (SSL handshake timeout)
  //   - "Connection terminated unexpectedly" (branch churn from re-deploy)
  // Retrying after a delay gives Neon time to provision the compute endpoint.
  const MAX_RETRIES = 5;
  const RETRY_DELAY_MS = 5000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    seedStatus.attempts = attempt;
    let pool;
    try {
      const poolConfig = buildPoolConfig(dbUrl);
      pool = new Pool(poolConfig);

      // Phase 1: Test basic connectivity
      console.log(`[e2e-seed] Attempt ${attempt}/${MAX_RETRIES}: testing connection...`);
      await testConnection(pool);
      console.log("[e2e-seed] Connection established — running seed queries...");

      // Phase 2: Run seed operations
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
        err.message.includes("terminated") ||
        err.message.includes("Connection refused") ||
        err.message.includes("ECONNRESET") ||
        err.message.includes("ECONNREFUSED") ||
        err.message.includes("ETIMEDOUT");

      if (isTransient && attempt < MAX_RETRIES) {
        console.warn(
          `[e2e-seed] Attempt ${attempt}/${MAX_RETRIES} failed: ${err.message} — ` +
            `retrying in ${RETRY_DELAY_MS / 1000}s...`,
        );
        seedStatus.error = `Attempt ${attempt}: ${err.message}`;
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      } else {
        seedStatus.error = err.message;
        console.error(
          `[e2e-seed] E2E seed failed after ${attempt} attempt(s): ${err.message}`,
        );
        if (err.stack) console.error(`[e2e-seed] Stack: ${err.stack}`);
      }
    } finally {
      if (pool) await closePool(pool);
    }
  }
}
