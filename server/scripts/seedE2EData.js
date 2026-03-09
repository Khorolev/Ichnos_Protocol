/**
 * Seed E2E test data into the database.
 *
 * Required env vars: DATABASE_URL, E2E_ADMIN_EMAIL, E2E_ADMIN_UID.
 * If any is missing the script exits silently (exit 0).
 */
import pg from "pg";

const { Pool } = pg;

const { DATABASE_URL, E2E_ADMIN_EMAIL, E2E_ADMIN_UID } = process.env;

if (!DATABASE_URL || !E2E_ADMIN_EMAIL || !E2E_ADMIN_UID) {
  console.log("Skipping E2E seed: required env vars not set");
  process.exit(0);
}

const pool = new Pool({ connectionString: DATABASE_URL });

try {
  const userRes = await pool.query(
    `INSERT INTO users (firebase_uid)
     VALUES ($1)
     ON CONFLICT (firebase_uid) DO UPDATE SET deleted_at = NULL`,
    [E2E_ADMIN_UID],
  );
  const reactivated = userRes.rowCount && !userRes.rows?.length;
  console.log("users:", userRes.rowCount ? "upserted" : "already active",
    reactivated ? "(reactivated)" : "");

  const profileRes = await pool.query(
    `INSERT INTO user_profiles (user_id, name, surname, email, company)
     VALUES ($1, $2, $3, $4, $5) ON CONFLICT (user_id) DO NOTHING`,
    [E2E_ADMIN_UID, "E2E", "Admin", E2E_ADMIN_EMAIL, "E2E Corp"],
  );
  console.log("user_profiles:", profileRes.rowCount ? "inserted" : "already exists");

  const existing = await pool.query(
    `SELECT id FROM contact_requests WHERE user_id = $1 LIMIT 1`,
    [E2E_ADMIN_UID],
  );

  let requestId;
  if (existing.rows.length > 0) {
    requestId = existing.rows[0].id;
    console.log("contact_requests: already exists (id:", requestId, ")");
  } else {
    const crRes = await pool.query(
      `INSERT INTO contact_requests
         (user_id, status, contact_consent_timestamp, contact_consent_version)
       VALUES ($1, 'new', NOW(), 'v1') RETURNING id`,
      [E2E_ADMIN_UID],
    );
    requestId = crRes.rows[0].id;
    console.log("contact_requests: inserted (id:", requestId, ")");
  }

  const qRes = await pool.query(
    `INSERT INTO questions (user_id, contact_request_id, question, source)
     SELECT $1, $2, 'E2E test question', 'form'
     WHERE NOT EXISTS (
       SELECT 1 FROM questions
       WHERE user_id = $1 AND contact_request_id = $2 AND question = 'E2E test question'
     )`,
    [E2E_ADMIN_UID, requestId],
  );
  console.log("questions:", qRes.rowCount ? "inserted" : "already exists");

  console.log("E2E seed complete");
} finally {
  await pool.end();
}
