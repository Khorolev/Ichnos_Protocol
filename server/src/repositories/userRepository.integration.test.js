/**
 * Integration Tests — User Repository
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

describeIf("userRepository (integration)", () => {
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
  });

  beforeEach(async () => {
    await pool.query("DELETE FROM user_profiles");
    await pool.query("DELETE FROM users");
  });

  afterAll(async () => {
    await pool.query("DROP TABLE IF EXISTS user_profiles CASCADE");
    await pool.query("DROP TABLE IF EXISTS users CASCADE");
    await pool.end();
  });

  it("creates a user and retrieves it by ID", async () => {
    await pool.query("INSERT INTO users (firebase_uid) VALUES ($1)", ["int-uid-1"]);
    const { rows } = await pool.query("SELECT * FROM users WHERE firebase_uid = $1", ["int-uid-1"]);

    expect(rows).toHaveLength(1);
    expect(rows[0].firebase_uid).toBe("int-uid-1");
  });

  it("cascades user_profiles delete when user is deleted", async () => {
    await pool.query("INSERT INTO users (firebase_uid) VALUES ($1)", ["int-uid-2"]);
    await pool.query(
      "INSERT INTO user_profiles (user_id, name, surname, email) VALUES ($1, $2, $3, $4)",
      ["int-uid-2", "Jane", "Doe", "jane@test.com"],
    );

    await pool.query("DELETE FROM users WHERE firebase_uid = $1", ["int-uid-2"]);

    const { rows } = await pool.query("SELECT * FROM user_profiles WHERE user_id = $1", ["int-uid-2"]);
    expect(rows).toHaveLength(0);
  });

  it("enforces FK constraint on user_profiles.user_id", async () => {
    await expect(
      pool.query(
        "INSERT INTO user_profiles (user_id, name, surname, email) VALUES ($1, $2, $3, $4)",
        ["nonexistent-uid", "Ghost", "User", "ghost@test.com"],
      ),
    ).rejects.toThrow();
  });

  it("upserts profile on conflict", async () => {
    await pool.query("INSERT INTO users (firebase_uid) VALUES ($1)", ["int-uid-3"]);
    await pool.query(
      "INSERT INTO user_profiles (user_id, name, surname, email) VALUES ($1, $2, $3, $4)",
      ["int-uid-3", "Old", "Name", "old@test.com"],
    );

    await pool.query(
      `INSERT INTO user_profiles (user_id, name, surname, email)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id)
       DO UPDATE SET name = $2, surname = $3, email = $4`,
      ["int-uid-3", "New", "Name", "new@test.com"],
    );

    const { rows } = await pool.query("SELECT * FROM user_profiles WHERE user_id = $1", ["int-uid-3"]);
    expect(rows[0].name).toBe("New");
    expect(rows[0].email).toBe("new@test.com");
  });

  it("prevents duplicate firebase_uid", async () => {
    await pool.query("INSERT INTO users (firebase_uid) VALUES ($1)", ["int-uid-4"]);

    await expect(
      pool.query("INSERT INTO users (firebase_uid) VALUES ($1)", ["int-uid-4"]),
    ).rejects.toThrow();
  });
});
