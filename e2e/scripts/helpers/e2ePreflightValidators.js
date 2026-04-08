const OPTIONAL_ROLES = ["USER", "SUPER_ADMIN", "MANAGE_ADMIN_TARGET"];

function fail(message, remediation) {
  throw new Error(`${message}\nRemediation: ${remediation}`);
}

/**
 * Validate admin credentials. In sync-only mode, only email + UID are needed
 * (no Firebase sign-in). In full mode, email + password are required.
 */
function validateAdminCredentials(env, syncOnly) {
  if (!env.E2E_ADMIN_EMAIL) {
    fail(
      "E2E_ADMIN_EMAIL is required.",
      "Fill in E2E_ADMIN_EMAIL in e2e/.env.e2e.",
    );
  }
  if (!syncOnly && !env.E2E_ADMIN_PASSWORD) {
    fail(
      "E2E_ADMIN_PASSWORD is required for full provisioning.",
      "Export E2E_ADMIN_PASSWORD in your shell before running the provision script (e.g. export E2E_ADMIN_PASSWORD=...).",
    );
  }
}

/**
 * Validate optional roles. In sync-only mode, only email + UID are checked.
 * In full mode, email + password are both required for Firebase provisioning.
 */
function validateOptionalRole(role, env, syncOnly) {
  const email = env[`E2E_${role}_EMAIL`];
  const password = env[`E2E_${role}_PASSWORD`];
  const uid = env[`E2E_${role}_UID`];
  const hasRole = email || password || uid;
  if (!hasRole) return;

  if (!email) {
    fail(
      `${role} is partially configured — E2E_${role}_EMAIL is required.`,
      `Provide email for ${role} in e2e/.env.e2e, or remove all ${role} fields.`,
    );
  }
  if (!syncOnly && !password) {
    fail(
      `${role} is partially configured — E2E_${role}_PASSWORD is required for full provisioning.`,
      `Export E2E_${role}_PASSWORD in your shell before running the provision script.`,
    );
  }
  if (syncOnly && !uid) {
    fail(
      `E2E_${role}_UID is required for sync-only mode (${role} is configured).`,
      "Run without --sync-only to provision Firebase and generate UIDs.",
    );
  }
}

function validateDistinctEmails(env) {
  const targetEmail = env.E2E_MANAGE_ADMIN_TARGET_EMAIL;
  if (!targetEmail) return;

  const roleEmails = [
    ["ADMIN", env.E2E_ADMIN_EMAIL],
    ["USER", env.E2E_USER_EMAIL],
    ["SUPER_ADMIN", env.E2E_SUPER_ADMIN_EMAIL],
  ];

  for (const [role, email] of roleEmails) {
    if (email && targetEmail.toLowerCase() === email.toLowerCase()) {
      fail(
        `E2E_MANAGE_ADMIN_TARGET_EMAIL must not match E2E_${role}_EMAIL (${email}). ` +
          "Destructive manage-admin tests would mutate a shared account.",
        `Create a dedicated Firebase user for MANAGE_ADMIN_TARGET that differs from all other E2E role emails.`,
      );
    }
  }
}

export function validateCredentials(env, syncOnly) {
  validateAdminCredentials(env, syncOnly);
  for (const role of OPTIONAL_ROLES) {
    validateOptionalRole(role, env, syncOnly);
  }
  validateDistinctEmails(env);
  if (syncOnly && !env.E2E_ADMIN_UID) {
    fail(
      "E2E_ADMIN_UID is required for sync-only mode.",
      "Run without --sync-only to provision Firebase and generate UIDs.",
    );
  }
}
