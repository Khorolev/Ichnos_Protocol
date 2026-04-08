#!/usr/bin/env node

/**
 * Thin wrapper that delegates to server/scripts/provision-e2e-firebase-users.js
 * where firebase-admin and ESM (type: module) are available.
 *
 * Forwards all CLI args (e.g. --sync-only) to the server script.
 *
 * Usage from repo root:
 *   node scripts/provision-e2e-firebase-users.js
 *   node scripts/provision-e2e-firebase-users.js --sync-only
 */

const { execFileSync } = require("node:child_process");
const { resolve } = require("node:path");

const script = resolve(
  __dirname,
  "..",
  "e2e",
  "scripts",
  "provision-e2e-firebase-users.js",
);

const args = process.argv.slice(2);

try {
  execFileSync("node", [script, ...args], {
    stdio: "inherit",
    env: process.env,
  });
} catch {
  process.exit(1);
}
