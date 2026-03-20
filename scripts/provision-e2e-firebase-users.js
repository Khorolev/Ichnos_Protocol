#!/usr/bin/env node

/**
 * Thin wrapper that delegates to server/scripts/provision-e2e-firebase-users.js
 * where firebase-admin and ESM (type: module) are available.
 *
 * Usage from repo root:
 *   node scripts/provision-e2e-firebase-users.js
 */

const { execSync } = require("node:child_process");
const { resolve } = require("node:path");

const script = resolve(
  __dirname,
  "..",
  "server",
  "scripts",
  "provision-e2e-firebase-users.js",
);

try {
  execSync(`node "${script}"`, { stdio: "inherit", env: process.env });
} catch {
  process.exit(1);
}
