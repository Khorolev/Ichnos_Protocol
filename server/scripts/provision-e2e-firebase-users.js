/**
 * Provision Firebase Authentication users for E2E testing.
 *
 * Idempotent: creates users if they don't exist, updates custom claims
 * if they do. Safe to re-run without creating duplicates.
 *
 * Required env vars:
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *   E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD
 *
 * Optional env vars (each pair must be complete):
 *   E2E_USER_EMAIL, E2E_USER_PASSWORD
 *   E2E_SUPER_ADMIN_EMAIL, E2E_SUPER_ADMIN_PASSWORD
 *
 * Usage:
 *   cd server && node scripts/provision-e2e-firebase-users.js
 */
import "dotenv/config";
import admin from "firebase-admin";

const REQUIRED_VARS = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "E2E_ADMIN_EMAIL",
  "E2E_ADMIN_PASSWORD",
];

const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error(
    `Missing required env vars: ${missing.join(", ")}\n` +
      "Set these in your .env or environment before running.",
  );
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

const auth = admin.auth();

async function provisionUser(email, password, claims, label) {
  let user;
  try {
    user = await auth.getUserByEmail(email);
    console.log(`[${label}] Found existing user: ${user.uid}`);
    await auth.updateUser(user.uid, { password });
    console.log(`[${label}] Password updated.`);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      user = await auth.createUser({ email, password });
      console.log(`[${label}] Created new user: ${user.uid}`);
    } else {
      throw err;
    }
  }

  await auth.setCustomUserClaims(user.uid, claims);
  console.log(`[${label}] Custom claims set:`, JSON.stringify(claims));
  return user.uid;
}

try {
  const adminUid = await provisionUser(
    process.env.E2E_ADMIN_EMAIL,
    process.env.E2E_ADMIN_PASSWORD,
    { role: "admin" },
    "admin",
  );
  console.log(`Admin UID: ${adminUid}`);

  if (process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD) {
    const userUid = await provisionUser(
      process.env.E2E_USER_EMAIL,
      process.env.E2E_USER_PASSWORD,
      {},
      "user",
    );
    console.log(`User UID: ${userUid}`);
  } else {
    console.log("[user] Skipped — E2E_USER_EMAIL/PASSWORD not set.");
  }

  if (
    process.env.E2E_SUPER_ADMIN_EMAIL &&
    process.env.E2E_SUPER_ADMIN_PASSWORD
  ) {
    const superAdminUid = await provisionUser(
      process.env.E2E_SUPER_ADMIN_EMAIL,
      process.env.E2E_SUPER_ADMIN_PASSWORD,
      { role: "admin", superAdmin: true },
      "super-admin",
    );
    console.log(`Super Admin UID: ${superAdminUid}`);
  } else {
    console.log(
      "[super-admin] Skipped — E2E_SUPER_ADMIN_EMAIL/PASSWORD not set.",
    );
  }

  console.log("\nProvisioning complete.");
} catch (err) {
  console.error("Provisioning failed:", err.message);
  process.exit(1);
}
