/**
 * Integration Tests — Question Repository
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

describeIf("questionRepository (integration)", () => {
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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id                  SERIAL PRIMARY KEY,
        user_id             VARCHAR(128) NOT NULL REFERENCES users(firebase_uid),
        question            TEXT NOT NULL,
        answer              TEXT,
        source              VARCHAR(50) NOT NULL,
        contact_request_id  INTEGER REFERENCES contact_requests(id) ON DELETE SET NULL,
        created_at          TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS question_topics (
        id          SERIAL PRIMARY KEY,
        question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        topic       VARCHAR(255) NOT NULL,
        confidence  REAL,
        model       VARCHAR(100)
      )
    `);
  });

  beforeEach(async () => {
    await pool.query("DELETE FROM question_topics");
    await pool.query("DELETE FROM questions");
    await pool.query("DELETE FROM contact_requests");
    await pool.query("DELETE FROM users");
    await pool.query("INSERT INTO users (firebase_uid) VALUES ($1)", ["test-uid"]);
  });

  afterAll(async () => {
    await pool.query("DROP TABLE IF EXISTS question_topics CASCADE");
    await pool.query("DROP TABLE IF EXISTS questions CASCADE");
    await pool.query("DROP TABLE IF EXISTS contact_requests CASCADE");
    await pool.query("DROP TABLE IF EXISTS users CASCADE");
    await pool.end();
  });

  it("creates a question linked to a user", async () => {
    const { rows } = await pool.query(
      `INSERT INTO questions (user_id, question, source) VALUES ($1, $2, $3) RETURNING *`,
      ["test-uid", "What is Ichnos?", "chat"],
    );

    expect(rows[0].user_id).toBe("test-uid");
    expect(rows[0].question).toBe("What is Ichnos?");
  });

  it("enforces FK constraint on questions.user_id", async () => {
    await expect(
      pool.query(
        `INSERT INTO questions (user_id, question, source) VALUES ($1, $2, $3)`,
        ["ghost-uid", "Q?", "chat"],
      ),
    ).rejects.toThrow();
  });

  it("links question to contact_request and cascades SET NULL on delete", async () => {
    const { rows: cr } = await pool.query(
      `INSERT INTO contact_requests (user_id, contact_consent_timestamp, contact_consent_version)
       VALUES ($1, $2, $3) RETURNING *`,
      ["test-uid", "2026-01-01T00:00:00Z", "v1"],
    );
    const { rows: q } = await pool.query(
      `INSERT INTO questions (user_id, question, source, contact_request_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      ["test-uid", "Q?", "form", cr[0].id],
    );

    expect(q[0].contact_request_id).toBe(cr[0].id);

    await pool.query("DELETE FROM contact_requests WHERE id = $1", [cr[0].id]);

    const { rows: after } = await pool.query(
      "SELECT contact_request_id FROM questions WHERE id = $1",
      [q[0].id],
    );
    expect(after[0].contact_request_id).toBeNull();
  });

  it("cascades topic delete when question is deleted", async () => {
    const { rows: q } = await pool.query(
      `INSERT INTO questions (user_id, question, source) VALUES ($1, $2, $3) RETURNING *`,
      ["test-uid", "Q?", "chat"],
    );
    await pool.query(
      `INSERT INTO question_topics (question_id, topic, confidence, model)
       VALUES ($1, $2, $3, $4)`,
      [q[0].id, "battery", 0.9, "grok-2"],
    );

    await pool.query("DELETE FROM questions WHERE id = $1", [q[0].id]);

    const { rows: topics } = await pool.query(
      "SELECT * FROM question_topics WHERE question_id = $1",
      [q[0].id],
    );
    expect(topics).toHaveLength(0);
  });

  it("enforces FK constraint on question_topics.question_id", async () => {
    await expect(
      pool.query(
        `INSERT INTO question_topics (question_id, topic) VALUES ($1, $2)`,
        [99999, "battery"],
      ),
    ).rejects.toThrow();
  });
});
