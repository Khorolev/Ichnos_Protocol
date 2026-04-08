const ROLES = [
  { key: "ADMIN", name: "E2E Admin", claims: { admin: true } },
  { key: "USER", name: "E2E Test User", claims: {} },
  { key: "SUPER_ADMIN", name: "E2E Super Admin", claims: { admin: true, superAdmin: true } },
  { key: "MANAGE_ADMIN_TARGET", name: "E2E Manage-Admin Target", claims: {} },
];

export function buildCredentialMaps(env) {
  const github = {};
  const vercel = {};
  const firebaseCreds = [];

  for (const role of ROLES) {
    const email = env[`E2E_${role.key}_EMAIL`];
    if (!email) continue;
    const password = env[`E2E_${role.key}_PASSWORD`];
    const uid = env[`E2E_${role.key}_UID`];

    github[`E2E_${role.key}_PASSWORD`] = password;
    vercel[`E2E_${role.key}_EMAIL`] = email;
    vercel[`E2E_${role.key}_UID`] = uid;

    firebaseCreds.push({
      email, password, displayName: role.name,
      claims: role.claims, uidKey: `E2E_${role.key}_UID`,
    });
  }

  return { github, vercel, firebaseCreds };
}
