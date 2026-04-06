/**
 * Playwright global setup — validates that configured E2E Firebase accounts
 * can sign in before running tests, then generates storageState files for
 * each configured role.
 *
 * Auth state is bootstrapped via the Firebase REST API + browser localStorage
 * injection — no login UI interaction. This keeps auth-UI specs
 * (auth.spec.js, login.spec.js) independently runnable even when the login
 * modal has regressions.
 *
 * Server readiness (HTTP 200 + DB seed completion) is handled by the CI
 * workflow's curl-based polling step, which reliably bypasses Vercel
 * Deployment Protection via headers. Node.js fetch() cannot do this because
 * the Fetch spec strips custom headers on cross-origin redirects.
 *
 * In local development, the server is assumed to be running already.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "@playwright/test";
import { validateFirebaseCredentials } from "./tests/helpers/validate-firebase.js";
import {
  ADMIN,
  USER,
  SUPER_ADMIN,
  isConfigured,
} from "./tests/helpers/credentials.js";
import { TIMEOUTS } from "./tests/helpers/app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, ".auth");
const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

const SIGN_IN_URL =
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword";

const ROLES = [
  { label: "admin", credentials: ADMIN, file: "admin.json" },
  { label: "user", credentials: USER, file: "user.json" },
  { label: "super-admin", credentials: SUPER_ADMIN, file: "super-admin.json" },
];

/**
 * Authenticate via Firebase REST API (no browser / UI needed).
 * Returns the REST response containing idToken, refreshToken, localId, etc.
 */
async function firebaseRestSignIn(email, password) {
  const url = `${SIGN_IN_URL}?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const code = body?.error?.message || res.statusText;
    throw new Error(
      `[global-setup] Firebase REST sign-in failed for ${email}: ${code}`,
    );
  }

  return res.json();
}

/**
 * Generate storageState for a single role by:
 * 1. Authenticating via the Firebase REST API (no UI).
 * 2. Opening a browser context, navigating to the app origin to collect
 *    cookies (including Vercel bypass cookies).
 * 3. Injecting the Firebase auth user data into localStorage so the SDK
 *    recognises the session on next page load.
 * 4. Reloading to verify the app sees the authenticated user.
 * 5. Saving the resulting storageState to disk.
 */
async function generateAuthState(browser, role) {
  const contextOptions = {
    baseURL: BASE_URL,
    ...(BYPASS_SECRET && {
      extraHTTPHeaders: {
        "x-vercel-protection-bypass": BYPASS_SECRET,
        "x-vercel-set-bypass-cookie": "samesitenone",
      },
    }),
  };

  // Step 1 — REST API sign-in (no UI)
  const authResult = await firebaseRestSignIn(
    role.credentials.email,
    role.credentials.password,
  );

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  try {
    // Step 2 — navigate to establish correct origin for storage + cookies
    await page.goto("/", {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUTS.appReady,
    });

    // Step 3 — inject Firebase auth state into localStorage
    await page.evaluate(
      ({ apiKey, uid, email, idToken, refreshToken, expiresIn }) => {
        const storageKey = `firebase:authUser:${apiKey}:[DEFAULT]`;
        const userData = {
          uid,
          email,
          emailVerified: true,
          displayName: null,
          isAnonymous: false,
          photoURL: null,
          phoneNumber: null,
          tenantId: null,
          providerData: [
            {
              uid: email,
              displayName: null,
              email,
              phoneNumber: null,
              photoURL: null,
              providerId: "password",
            },
          ],
          stsTokenManager: {
            refreshToken,
            accessToken: idToken,
            expirationTime:
              Date.now() + Number.parseInt(expiresIn, 10) * 1000,
          },
          createdAt: String(Date.now()),
          lastLoginAt: String(Date.now()),
          apiKey,
          appName: "[DEFAULT]",
        };
        localStorage.setItem(storageKey, JSON.stringify(userData));
      },
      {
        apiKey: FIREBASE_API_KEY,
        uid: authResult.localId,
        email: authResult.email,
        idToken: authResult.idToken,
        refreshToken: authResult.refreshToken,
        expiresIn: authResult.expiresIn,
      },
    );

    // Step 4 — reload to finalise cookies, then verify the auth state
    // persisted in localStorage without asserting on any app UI.
    // Auth-UI verification (e.g. user-menu-toggle) is the responsibility
    // of the dedicated auth specs (login.spec.js, auth.spec.js).
    await page.reload({
      waitUntil: "domcontentloaded",
      timeout: TIMEOUTS.appReady,
    });
    const hasAuthState = await page.evaluate((apiKey) => {
      const key = `firebase:authUser:${apiKey}:[DEFAULT]`;
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return !!(parsed?.uid && parsed?.stsTokenManager?.accessToken);
    }, FIREBASE_API_KEY);
    if (!hasAuthState) {
      throw new Error(
        `[global-setup] Firebase auth state not found in localStorage for ${role.label} after reload`,
      );
    }

    // Step 5 — persist storageState (cookies + localStorage)
    const statePath = path.join(AUTH_DIR, role.file);
    await context.storageState({ path: statePath });
    console.log(
      `[global-setup] StorageState saved for ${role.label} → ${role.file}`,
    );
  } finally {
    await context.close();
  }
}

export default async function globalSetup() {
  await validateFirebaseCredentials();

  // CI-only preflight: detect ApiSanityWarning on the deployed client.
  // If the warning is visible, /api routing is misconfigured — abort early.
  if (process.env.CI) {
    console.log(`[global-setup] Running API sanity preflight check at ${BASE_URL}...`);
    const prefBrowser = await chromium.launch();
    try {
      const contextOptions = {
        baseURL: BASE_URL,
        ...(BYPASS_SECRET && {
          extraHTTPHeaders: {
            "x-vercel-protection-bypass": BYPASS_SECRET,
            "x-vercel-set-bypass-cookie": "samesitenone",
          },
        }),
      };
      const prefContext = await prefBrowser.newContext(contextOptions);
      const prefPage = await prefContext.newPage();
      try {
        await prefPage.goto("/", {
          waitUntil: "domcontentloaded",
          timeout: TIMEOUTS.appReady,
        });

        const warningEl = await prefPage
          .locator('[data-testid="api-sanity-warning"]')
          .waitFor({ state: "visible", timeout: 8000 })
          .catch(() => null);

        if (warningEl !== null) {
          throw new Error(
            `[global-setup] API Configuration Warning detected at ${BASE_URL}. Fix the /api routing configuration before running E2E tests.`,
          );
        }

        console.log(
          `[global-setup] API sanity preflight passed — no configuration warning detected.`,
        );
      } finally {
        await prefContext.close();
      }
    } finally {
      await prefBrowser.close();
    }
  }

  // Always wipe stale auth state before anything else so that an
  // unconfigured run never leaves reusable files from a prior run.
  if (fs.existsSync(AUTH_DIR)) {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  }

  const configuredRoles = ROLES.filter((r) => isConfigured(r.credentials));

  if (configuredRoles.length === 0) {
    console.log(
      "[global-setup] No configured roles — skipping storageState generation.",
    );
    return;
  }

  if (!FIREBASE_API_KEY) {
    throw new Error(
      "[global-setup] FIREBASE_API_KEY is required for storageState generation " +
        "via the REST API. Set it in the environment.",
    );
  }

  fs.mkdirSync(AUTH_DIR, { recursive: true });

  console.log(
    `[global-setup] Generating storageState for ${configuredRoles.length} role(s)...`,
  );
  const browser = await chromium.launch();

  try {
    // Sequential processing to avoid Firebase rate limiting and concurrent
    // login conflicts on shared accounts
    for (const role of configuredRoles) {
      await generateAuthState(browser, role);
    }
  } finally {
    await browser.close();
  }

  console.log("[global-setup] StorageState generation complete.");
}
