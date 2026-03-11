/**
 * Seed PostgreSQL with E2E test data (users, profiles, contact requests).
 */
import pg from "pg";

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
  console.log(`[db] upserted user: ${email}`);
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
  console.log(`[db] contact request ready for uid: ${uid}`);
}

export async function seedTestDatabase({
  connectionString,
  userUid,
  adminUid,
  superAdminUid,
}) {
  const pool = new pg.Pool({ connectionString });

  try {
    await upsertUser(pool, userUid, "E2E", "User", process.env.E2E_USER_EMAIL);
    await upsertUser(pool, adminUid, "E2E", "Admin", process.env.E2E_ADMIN_EMAIL);
    await upsertUser(
      pool, superAdminUid, "E2E", "SuperAdmin", process.env.E2E_SUPER_ADMIN_EMAIL,
    );

    await upsertContactRequest(pool, adminUid);
    await upsertContactRequest(pool, superAdminUid);

    console.log("[db] test seed complete");
  } finally {
    await pool.end();
  }
}
