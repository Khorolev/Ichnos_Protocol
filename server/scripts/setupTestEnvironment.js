/**
 * Master orchestrator: set up a complete E2E test environment.
 *
 * 1. Firebase Auth users (create / update)
 * 2. PostgreSQL migrations
 * 3. Database seed data
 * 4. Firestore knowledge base seed
 *
 * Usage: node scripts/setupTestEnvironment.js
 * Reads configuration from server/.env.test
 */
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env.test") });

import admin from "firebase-admin";
import { runMigrations } from "./runMigrations.js";
import { setupFirebaseTestUsers } from "../../e2e/scripts/helpers/firebaseTestSetup.js";
import { seedTestDatabase } from "./helpers/dbTestSeed.js";
import { SEED_DOCUMENTS } from "./helpers/knowledgeBaseDocs.js";

const REQUIRED_VARS = [
  "DATABASE_URL",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "E2E_USER_EMAIL",
  "E2E_USER_PASSWORD",
  "E2E_ADMIN_EMAIL",
  "E2E_ADMIN_PASSWORD",
  "E2E_SUPER_ADMIN_EMAIL",
  "E2E_SUPER_ADMIN_PASSWORD",
];

function checkPrerequisites() {
  const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
  if (missing.length === 0) return;
  console.error("Missing required environment variables:");
  missing.forEach((v) => console.error(`  - ${v}`));
  process.exit(1);
}

async function seedKnowledgeBase(app) {
  const db = app.firestore();
  const collection = db.collection("knowledge_base");
  const batch = db.batch();
  let created = 0;

  for (const doc of SEED_DOCUMENTS) {
    const snap = await collection.where("title", "==", doc.title).limit(1).get();
    if (!snap.empty) continue;
    batch.set(collection.doc(), {
      ...doc,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: "seed-script",
    });
    created++;
  }

  if (created > 0) await batch.commit();
  console.log(`[firestore] knowledge base: ${created} created, ${SEED_DOCUMENTS.length - created} skipped`);
}

function printSummary(uids) {
  const lines = [
    "",
    "┌─────────────────────────────────────────────────────────┐",
    "│           GitHub Actions Secrets Summary                │",
    "├─────────────────────────────────────────────────────────┤",
    `│  E2E_USER_EMAIL         = ${process.env.E2E_USER_EMAIL}`,
    `│  E2E_USER_PASSWORD      = ${process.env.E2E_USER_PASSWORD}`,
    `│  E2E_USER_UID           = ${uids.userUid}`,
    `│  E2E_ADMIN_EMAIL        = ${process.env.E2E_ADMIN_EMAIL}`,
    `│  E2E_ADMIN_PASSWORD     = ${process.env.E2E_ADMIN_PASSWORD}`,
    `│  E2E_ADMIN_UID          = ${uids.adminUid}`,
    `│  E2E_SUPER_ADMIN_EMAIL  = ${process.env.E2E_SUPER_ADMIN_EMAIL}`,
    `│  E2E_SUPER_ADMIN_PASSWORD = ${process.env.E2E_SUPER_ADMIN_PASSWORD}`,
    `│  E2E_SUPER_ADMIN_UID    = ${uids.superAdminUid}`,
    "├─────────────────────────────────────────────────────────┤",
    "│  Copy these values into your GitHub repo secrets.       │",
    "└─────────────────────────────────────────────────────────┘",
    "",
  ];
  console.log(lines.join("\n"));
}

async function main() {
  checkPrerequisites();

  console.log("\n=== Step 1: Firebase Auth users ===");
  const uids = await setupFirebaseTestUsers();

  console.log("\n=== Step 2: PostgreSQL migrations ===");
  await runMigrations(process.env.DATABASE_URL);

  console.log("\n=== Step 3: Database seed data ===");
  await seedTestDatabase({
    connectionString: process.env.DATABASE_URL,
    ...uids,
  });

  console.log("\n=== Step 4: Firestore knowledge base ===");
  const testApp = admin.apps.find((a) => a.name === "test-setup");
  await seedKnowledgeBase(testApp);

  printSummary(uids);
  console.log("Test environment setup complete.");
}

main().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
