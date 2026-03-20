export const USER = {
  email: process.env.E2E_USER_EMAIL,
  password: process.env.E2E_USER_PASSWORD,
};

export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL,
  password: process.env.E2E_ADMIN_PASSWORD,
};

export const SUPER_ADMIN = {
  email: process.env.E2E_SUPER_ADMIN_EMAIL,
  password: process.env.E2E_SUPER_ADMIN_PASSWORD,
};

export function isConfigured(...accounts) {
  return accounts.every((a) => a.email && a.password);
}
