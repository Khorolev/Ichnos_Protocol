/**
 * Seed E2E test data into the database.
 *
 * Required env vars: DATABASE_URL, E2E_ADMIN_EMAIL, E2E_ADMIN_UID.
 * Optional env vars: E2E_USER_EMAIL, E2E_USER_UID,
 *                    E2E_INCOMPLETE_USER_EMAIL, E2E_INCOMPLETE_USER_UID,
 *                    E2E_SUPER_ADMIN_EMAIL, E2E_SUPER_ADMIN_UID.
 * If required vars are missing the script exits silently (exit 0).
 * Note: In Vercel preview environments, seeding is done automatically via seedE2EOnPreview.js on server startup.
 */
import pg from "pg";

const { Pool } = pg;

const {
  DATABASE_URL,
  E2E_USER_EMAIL,
  E2E_USER_UID,
  E2E_INCOMPLETE_USER_EMAIL,
  E2E_INCOMPLETE_USER_UID,
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_UID,
  E2E_SUPER_ADMIN_EMAIL,
  E2E_SUPER_ADMIN_UID,
} = process.env;

if (!DATABASE_URL || !E2E_ADMIN_EMAIL || !E2E_ADMIN_UID) {
  console.log("Skipping E2E seed: required env vars not set");
  process.exit(0);
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
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE
       SET name = $2, surname = $3, email = $4, company = $5`,
    [uid, firstName, lastName, email, "E2E Corp"],
  );
  console.log(`users + profile: upserted (${email})`);
}

/**
 * Seed a user whose profile is deliberately incomplete (empty name/surname).
 *
 * The profile-completion E2E spec relies on this account so that a real
 * login always opens the "Complete Your Profile" modal. We store empty
 * strings (not NULL) because the user_profiles.name / surname columns are
 * NOT NULL, and computeProfileState() treats empty strings as missing.
 *
 * Idempotent: re-running the seed resets name/surname back to '' even if a
 * prior test run successfully completed the profile.
 */
async function upsertIncompleteUser(pool, uid, email) {
  await pool.query(
    `INSERT INTO users (firebase_uid)
     VALUES ($1)
     ON CONFLICT (firebase_uid) DO UPDATE SET deleted_at = NULL`,
    [uid],
  );
  await pool.query(
    `INSERT INTO user_profiles (user_id, name, surname, email, company)
     VALUES ($1, '', '', $2, NULL)
     ON CONFLICT (user_id) DO UPDATE
       SET name = '', surname = '', email = $2, company = NULL`,
    [uid, email],
  );
  console.log(`users + profile: upserted INCOMPLETE (${email})`);
}

async function upsertContactRequest(pool, uid) {
  const existing = await pool.query(
    "SELECT id FROM contact_requests WHERE user_id = $1 LIMIT 1",
    [uid],
  );

  let requestId;
  if (existing.rows.length > 0) {
    requestId = existing.rows[0].id;
    console.log("contact_requests: already exists (id:", requestId, ")");
  } else {
    const res = await pool.query(
      `INSERT INTO contact_requests
         (user_id, status, contact_consent_timestamp, contact_consent_version)
       VALUES ($1, 'new', NOW(), 'v1') RETURNING id`,
      [uid],
    );
    requestId = res.rows[0].id;
    console.log("contact_requests: inserted (id:", requestId, ")");
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

const pool = new Pool({ connectionString: DATABASE_URL });

try {
  if (E2E_USER_UID && E2E_USER_EMAIL) {
    await upsertUser(pool, E2E_USER_UID, "E2E", "User", E2E_USER_EMAIL);
  }

  if (E2E_INCOMPLETE_USER_UID && E2E_INCOMPLETE_USER_EMAIL) {
    await upsertIncompleteUser(
      pool,
      E2E_INCOMPLETE_USER_UID,
      E2E_INCOMPLETE_USER_EMAIL,
    );
  }

  await upsertUser(pool, E2E_ADMIN_UID, "E2E", "Admin", E2E_ADMIN_EMAIL);
  await upsertContactRequest(pool, E2E_ADMIN_UID);

  if (E2E_SUPER_ADMIN_UID && E2E_SUPER_ADMIN_EMAIL) {
    await upsertUser(
      pool, E2E_SUPER_ADMIN_UID, "E2E", "SuperAdmin", E2E_SUPER_ADMIN_EMAIL,
    );
    await upsertContactRequest(pool, E2E_SUPER_ADMIN_UID);
  }

  console.log("E2E seed complete");
} catch (err) {
  console.error(err.message);
  process.exit(1);
} finally {
  await pool.end();
}
