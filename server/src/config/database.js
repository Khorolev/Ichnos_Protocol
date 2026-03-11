/**
 * PostgreSQL Connection Pool Singleton
 *
 * Uses a global reference to maintain a single pool instance across
 * Vercel serverless invocations. On warm starts the existing pool is
 * reused, avoiding repeated connection negotiation with Neon Tech.
 */
import pg from "pg";

const { Pool } = pg;

if (!globalThis.__pgPool) {
  globalThis.__pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  globalThis.__pgPool.on("error", (err) => {
    console.error("Unexpected PostgreSQL pool error:", err);
  });
}

const pool = globalThis.__pgPool;

export default pool;
