/**
 * Run SQL migrations in order, tracking applied files in schema_migrations.
 *
 * Usage:
 *   - Standalone: DATABASE_URL=... node scripts/runMigrations.js
 *   - Imported:   import { runMigrations } from './runMigrations.js'
 */
import pg from "pg";
import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "../migrations");

async function loadAppliedSet(client) {
  try {
    const res = await client.query(
      "SELECT filename FROM schema_migrations",
    );
    return new Set(res.rows.map((r) => r.filename));
  } catch (err) {
    if (err.code === "42P01") return new Set();
    throw err;
  }
}

async function applyMigration(client, filename, sql, applied) {
  await client.query("BEGIN");
  await client.query(sql);
  if (applied.size > 0 || filename.startsWith("000")) {
    await client.query(
      "INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING",
      [filename],
    );
  }
  await client.query("COMMIT");
}

export async function runMigrations(connectionString) {
  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    const applied = await loadAppliedSet(client);
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[migration] skipping: ${file}`);
        continue;
      }
      console.log(`[migration] applying: ${file}`);
      const sql = fs.readFileSync(join(MIGRATIONS_DIR, file), "utf8");
      await applyMigration(client, file, sql, applied);
      applied.add(file);
    }
    console.log("[migration] done");
  } finally {
    await client.end();
  }
}

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url).endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop());

if (isMain) {
  runMigrations(process.env.DATABASE_URL).catch((err) => {
    console.error("[migration] failed:", err.message);
    process.exit(1);
  });
}
