/**
 * Validates configured E2E Firebase accounts by attempting sign-in
 * via the Firebase Auth REST API. Only checks credential sets that
 * are fully configured (email + password present).
 */
import { ADMIN, USER, SUPER_ADMIN, MANAGE_ADMIN_TARGET, isConfigured } from "./credentials.js";

const SIGN_IN_URL =
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword";

async function validateAccount(label, email, password, apiKey) {
  const url = `${SIGN_IN_URL}?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const code = body?.error?.message || res.statusText;
    throw new Error(
      `[global-setup] Firebase sign-in FAILED for ${label} (${email}): ${code}\n` +
        "  Run: cd server && node scripts/provision-e2e-firebase-users.js",
    );
  }

  console.log(`[global-setup] Firebase sign-in OK for ${label} (${email})`);
}

export async function validateFirebaseCredentials() {
  const apiKey = process.env.FIREBASE_API_KEY;

  if (!apiKey) {
    if (process.env.CI) {
      throw new Error(
        "[global-setup] FIREBASE_API_KEY is not set. " +
          "This secret must be configured for the E2E workflow.\n" +
          "  Provision accounts: cd server && node scripts/provision-e2e-firebase-users.js",
      );
    }
    console.log(
      "[global-setup] FIREBASE_API_KEY not set — skipping credential validation.",
    );
    return;
  }

  console.log("[global-setup] Validating Firebase E2E credentials...");

  const checks = [];

  if (isConfigured(ADMIN)) {
    checks.push(validateAccount("admin", ADMIN.email, ADMIN.password, apiKey));
  }
  if (isConfigured(USER)) {
    checks.push(validateAccount("user", USER.email, USER.password, apiKey));
  }
  if (isConfigured(SUPER_ADMIN)) {
    checks.push(
      validateAccount(
        "super-admin",
        SUPER_ADMIN.email,
        SUPER_ADMIN.password,
        apiKey,
      ),
    );
  }
  if (isConfigured(MANAGE_ADMIN_TARGET)) {
    checks.push(
      validateAccount(
        "manage-admin-target",
        MANAGE_ADMIN_TARGET.email,
        MANAGE_ADMIN_TARGET.password,
        apiKey,
      ),
    );
  }

  if (checks.length === 0) {
    console.log(
      "[global-setup] No E2E credential sets configured — skipping validation.",
    );
    return;
  }

  await Promise.all(checks);
  console.log("[global-setup] All configured Firebase credentials validated.");
}
