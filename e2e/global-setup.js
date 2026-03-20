/**
 * Playwright global setup — blocks test execution until the deployment is ready
 * and validates that configured E2E Firebase accounts can sign in.
 *
 * In CI, polls the server's /api/health endpoint until:
 *   1. The endpoint returns HTTP 200.
 *   2. The seed object reports seeded === true (or an error).
 *
 * Firebase credential validation:
 *   When FIREBASE_API_KEY is set, each configured credential set (admin, user,
 *   super-admin) is verified via the Firebase Auth REST signInWithPassword
 *   endpoint. Failures produce a clear message instructing the operator to run
 *   the provisioning script.
 *
 * Skipped in local development (non-CI) where the server is assumed ready.
 */

import { validateFirebaseCredentials } from "./tests/helpers/validate-firebase.js";

const IS_CI = !!process.env.CI;
const BASE_URL = process.env.BASE_URL || "http://localhost:5173";

const POLL_INTERVAL_MS = 5_000;
const MAX_WAIT_MS = 120_000;

function buildHealthUrl() {
  const apiBase = process.env.E2E_API_BASE_URL;
  if (apiBase) return `${apiBase.replace(/\/+$/, "")}/api/health`;

  if (IS_CI) {
    console.warn(
      '[global-setup] WARNING: E2E_API_BASE_URL is not set. Falling back to BASE_URL host + E2E_API_PORT. ' +
      'This may be incorrect for Vercel host-split deployments where the API URL differs from the client URL.',
    );
  }

  const url = new URL(BASE_URL);
  url.port = process.env.E2E_API_PORT || "3000";
  url.pathname = "/api/health";
  return url.toString();
}

function buildBypassHeaders() {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (!secret) return {};
  return {
    "x-vercel-protection-bypass": secret,
    "x-vercel-set-bypass-cookie": "samesitenone",
  };
}

async function pollHealth(url) {
  const start = Date.now();
  const headers = buildBypassHeaders();
  const hasBypass = Object.keys(headers).length > 0;
  console.log(`[global-setup] Bypass header configured: ${hasBypass}`);

  while (Date.now() - start < MAX_WAIT_MS) {
    try {
      const res = await fetch(url, { headers, redirect: "follow" });
      if (res.ok) {
        const body = await res.json();
        if (body.seed?.error) {
          throw new Error(
            `[global-setup] Seed failed on server: ${body.seed.error}`,
          );
        }
        if (body.seed?.seeded) {
          console.log("[global-setup] Server healthy and seed complete.");
          return;
        }
        console.log("[global-setup] Server healthy but seed in progress...");
      } else {
        console.log(`[global-setup] HTTP ${res.status} from ${res.url}`);
      }
    } catch (err) {
      if (err.message.includes("Seed failed")) throw err;
      const cause = err.cause ? ` | cause: ${err.cause.message || err.cause.code || JSON.stringify(err.cause)}` : '';
      console.log(`[global-setup] Waiting for ${url} ... (${err.message}${cause})`);
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error(
    `[global-setup] Server at ${url} did not become ready within ${MAX_WAIT_MS / 1000}s. ` +
      "Check that the deployment is live and seeding completes successfully.",
  );
}

export default async function globalSetup() {
  if (!IS_CI) {
    console.log("[global-setup] Skipping health poll (non-CI environment).");
    await validateFirebaseCredentials();
    return;
  }

  const healthUrl = buildHealthUrl();
  console.log(`[global-setup] Polling ${healthUrl} for readiness...`);
  await pollHealth(healthUrl);
  await validateFirebaseCredentials();
}
