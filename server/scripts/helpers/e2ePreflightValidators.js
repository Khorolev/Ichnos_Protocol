const OPTIONAL_ROLES = ["USER", "SUPER_ADMIN"];

function fail(message, remediation) {
  throw new Error(`${message}\nRemediation: ${remediation}`);
}

function validateAdminCredentials(env) {
  if (!env.E2E_ADMIN_EMAIL || !env.E2E_ADMIN_PASSWORD) {
    fail(
      "Admin credentials are required. E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be set.",
      "Fill in E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD in .env.e2e.",
    );
  }
}

function validateOptionalRole(role, env, syncOnly) {
  const email = env[`E2E_${role}_EMAIL`];
  const password = env[`E2E_${role}_PASSWORD`];
  const uid = env[`E2E_${role}_UID`];
  const hasRole = email || password || uid;
  if (!hasRole) return;

  if (!email || !password) {
    fail(
      `${role} is partially configured — E2E_${role}_EMAIL and E2E_${role}_PASSWORD are both required.`,
      `Provide both email and password for ${role}, or remove all ${role} fields.`,
    );
  }
  if (syncOnly && !uid) {
    fail(
      `E2E_${role}_UID is required for sync-only mode (${role} is configured).`,
      "Run without --sync-only to provision Firebase and generate UIDs.",
    );
  }
}

export function validateCredentials(env, syncOnly) {
  validateAdminCredentials(env);
  for (const role of OPTIONAL_ROLES) {
    validateOptionalRole(role, env, syncOnly);
  }
  if (syncOnly && !env.E2E_ADMIN_UID) {
    fail(
      "E2E_ADMIN_UID is required for sync-only mode.",
      "Run without --sync-only to provision Firebase and generate UIDs.",
    );
  }
}
