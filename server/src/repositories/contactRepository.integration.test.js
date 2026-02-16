/**
 * Integration Tests — Contact Repository
 *
 * Runs against a real PostgreSQL database via TEST_DATABASE_URL.
 * Skipped when the env var is not set.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import pg from "pg";

const TEST_DB_URL = process.env.TEST_DATABASE_URL;
const skip = !TEST_DB_URL;

const describeIf = skip ? describe.skip : describe;

let pool;

describeIf("contactRepository (integration)", () => {
  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: TEST_DB_URL });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        firebase_uid VARCHAR(128) PRIMARY KEY,
        deleted_at   TIMESTAMPTZ,
        created_at   TIMESTAMPTZ DEFAULT NOW(),
        updated_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id   VARCHAR(128) PRIMARY KEY REFERENCES users(firebase_uid) ON DELETE CASCADE,
        name      VARCHAR(255) NOT NULL,
        surname   VARCHAR(255) NOT NULL,
        email     VARCHAR(255) NOT NULL,
        phone     VARCHAR(50),
        company   VARCHAR(255),
        linkedin  VARCHAR(500)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_requests (
        id                          SERIAL PRIMARY KEY,
        user_id                     VARCHAR(128) NOT NULL REFERENCES users(firebase_uid),
        contact_consent_timestamp   TIMESTAMPTZ NOT NULL,
        contact_consent_version     VARCHAR(20) NOT NULL,
        status                      VARCHAR(50) DEFAULT 'new',
        admin_notes                 TEXT,
        created_at                  TIMESTAMPTZ DEFAULT NOW(),
        updated_at                  TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  });

  beforeEach(async () => {
    await pool.query("DELETE FROM contact_requests");
    await pool.query("DELETE FROM user_profiles");
    await pool.query("DELETE FROM users");
    await pool.query("INSERT INTO users (firebase_uid) VALUES ($1)", ["test-uid"]);
  });

  afterAll(async () => {
    await pool.query("DROP TABLE IF EXISTS contact_requests CASCADE");
    await pool.query("DROP TABLE IF EXISTS user_profiles CASCADE");
    await pool.query("DROP TABLE IF EXISTS users CASCADE");
    await pool.end();
  });

  it("creates a contact request linked to a user", async () => {
    const { rows } = await pool.query(
      `INSERT INTO contact_requests (user_id, contact_consent_timestamp, contact_consent_version)
       VALUES ($1, $2, $3) RETURNING *`,
      ["test-uid", "2026-01-01T00:00:00Z", "v1"],
    );

    expect(rows[0].user_id).toBe("test-uid");
    expect(rows[0].status).toBe("new");
  });

  it("enforces FK constraint on contact_requests.user_id", async () => {
    await expect(
      pool.query(
        `INSERT INTO contact_requests (user_id, contact_consent_timestamp, contact_consent_version)
         VALUES ($1, $2, $3)`,
        ["nonexistent-uid", "2026-01-01T00:00:00Z", "v1"],
      ),
    ).rejects.toThrow();
  });

  it("updates request status", async () => {
    const { rows: created } = await pool.query(
      `INSERT INTO contact_requests (user_id, contact_consent_timestamp, contact_consent_version)
       VALUES ($1, $2, $3) RETURNING *`,
      ["test-uid", "2026-01-01T00:00:00Z", "v1"],
    );

    const { rows: updated } = await pool.query(
      `UPDATE contact_requests SET status = $2 WHERE id = $1 RETURNING *`,
      [created[0].id, "in_progress"],
    );

    expect(updated[0].status).toBe("in_progress");
  });

  it("deletes a contact request", async () => {
    const { rows: created } = await pool.query(
      `INSERT INTO contact_requests (user_id, contact_consent_timestamp, contact_consent_version)
       VALUES ($1, $2, $3) RETURNING *`,
      ["test-uid", "2026-01-01T00:00:00Z", "v1"],
    );

    const { rowCount } = await pool.query(
      "DELETE FROM contact_requests WHERE id = $1",
      [created[0].id],
    );
    expect(rowCount).toBe(1);
  });

  it("joins contact requests with user profiles", async () => {
    await pool.query(
      "INSERT INTO user_profiles (user_id, name, surname, email) VALUES ($1, $2, $3, $4)",
      ["test-uid", "Alice", "Smith", "alice@test.com"],
    );
    await pool.query(
      `INSERT INTO contact_requests (user_id, contact_consent_timestamp, contact_consent_version)
       VALUES ($1, $2, $3)`,
      ["test-uid", "2026-01-01T00:00:00Z", "v1"],
    );

    const { rows } = await pool.query(
      `SELECT cr.*, p.name, p.surname, p.email
       FROM contact_requests cr
       JOIN users u ON cr.user_id = u.firebase_uid
       LEFT JOIN user_profiles p ON u.firebase_uid = p.user_id`,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Alice");
  });
});
