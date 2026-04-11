export const USER = {
  email: process.env.E2E_USER_EMAIL,
  password: process.env.E2E_USER_PASSWORD,
};

// Account deliberately seeded with an empty name/surname in Postgres so the
// profile-completion modal is guaranteed to open at login in CI. Never reuse
// this account in other specs — they would all trip the completion gate.
export const INCOMPLETE_USER = {
  email: process.env.E2E_INCOMPLETE_USER_EMAIL,
  password: process.env.E2E_INCOMPLETE_USER_PASSWORD,
};

export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL,
  password: process.env.E2E_ADMIN_PASSWORD,
};

export const SUPER_ADMIN = {
  email: process.env.E2E_SUPER_ADMIN_EMAIL,
  password: process.env.E2E_SUPER_ADMIN_PASSWORD,
};

export const MANAGE_ADMIN_TARGET = {
  email: process.env.E2E_MANAGE_ADMIN_TARGET_EMAIL,
  password: process.env.E2E_MANAGE_ADMIN_TARGET_PASSWORD,
};

export function isConfigured(...accounts) {
  return accounts.every((a) => a.email && a.password);
}
