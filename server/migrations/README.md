# Database Migrations

## Migration Strategy

This project uses a manual SQL migration approach. Each migration is a
timestamped `.sql` file executed against the Neon Tech PostgreSQL database in
sequential order. A `schema_migrations` table (created by the first migration)
tracks which files have already been applied.

## Naming Convention

```
NNN_YYYYMMDD_description.sql
```

- **NNN** — zero-padded sequence number (000, 001, 002, ...)
- **YYYYMMDD** — date the migration was authored
- **description** — short snake_case summary of the change

## Execution Instructions

1. Connect to the Neon PostgreSQL instance:

   ```bash
   psql "postgresql://user:password@host/dbname?sslmode=require"
   ```

2. Run each migration file **in numerical order**:

   ```bash
   psql "$DATABASE_URL" -f server/migrations/000_20260215_create_helpers.sql
   psql "$DATABASE_URL" -f server/migrations/001_20260215_create_users.sql
   psql "$DATABASE_URL" -f server/migrations/002_20260215_create_user_profiles.sql
   psql "$DATABASE_URL" -f server/migrations/003_20260215_create_contact_requests.sql
   psql "$DATABASE_URL" -f server/migrations/004_20260215_create_questions.sql
   psql "$DATABASE_URL" -f server/migrations/005_20260215_create_question_topics.sql
   ```

3. After **each** migration, record it in the tracking table:

   ```sql
   INSERT INTO schema_migrations (filename)
   VALUES ('000_20260215_create_helpers.sql');
   ```

4. Verify the migration was recorded:

   ```sql
   SELECT * FROM schema_migrations ORDER BY id;
   ```

## Idempotency

All migrations use `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`,
`CREATE OR REPLACE FUNCTION`, and `DROP TRIGGER IF EXISTS` guards. They can be
safely re-run without causing errors or duplicate objects.

## Rollback Strategy

There is no automated rollback mechanism in V1. To reverse a migration, write
the corresponding `DROP` statements manually and execute them against the
database. Always back up your data before running destructive rollback SQL.

## Testing Migrations

Before applying migrations to production:

1. Spin up a local PostgreSQL instance or create a temporary Neon branch.
2. Run every migration file in order.
3. Verify the schema with `\dt` (list tables) and `\d table_name` (describe).
4. Run the application test suite against the migrated database.

## Connection Pool Usage

Import the singleton pool from `server/src/config/database.js` in any
repository module:

```js
import pool from "../config/database.js";

const result = await pool.query("SELECT * FROM users WHERE firebase_uid = $1", [
  uid,
]);
```

The pool is stored on `globalThis` so it survives Vercel serverless warm starts
without creating duplicate connections.

## Environment Variables

| Variable       | Description                            |
| -------------- | -------------------------------------- |
| `DATABASE_URL` | Neon Tech PostgreSQL connection string |

Format:

```
postgresql://<user>:<password>@<host>/<database>?sslmode=require
```

Set this variable in `server/.env` for local development and in Vercel project
settings for deployed environments. **Never commit `.env` files.**

## Schema Diagram

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Migrations as Migration Files
    participant DB as PostgreSQL (Neon)
    participant Tracking as schema_migrations

    Dev->>Migrations: Execute 000_create_helpers.sql
    Migrations->>DB: CREATE TABLE schema_migrations
    Migrations->>DB: CREATE FUNCTION update_updated_at()
    Dev->>Tracking: INSERT filename, applied_at

    Dev->>Migrations: Execute 001_create_users.sql
    Migrations->>DB: CREATE TABLE users
    Migrations->>DB: CREATE INDEX, TRIGGER
    Dev->>Tracking: INSERT filename, applied_at

    Dev->>Migrations: Execute 002-005 (remaining tables)
    Migrations->>DB: CREATE TABLES with FK constraints
    Migrations->>DB: CREATE INDEXES, TRIGGERS
    Dev->>Tracking: INSERT filenames, applied_at

    Note over DB,Tracking: All migrations tracked and idempotent
```
