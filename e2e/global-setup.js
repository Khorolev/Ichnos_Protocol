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

  // Step 2 — build the auth data to inject BEFORE page scripts run.
  //
  // Firebase SDK v12 uses IndexedDB for persistence. On initialization it
  // reads the legacy localStorage key `firebase:authUser:*` as a migration
  // path — but only ONCE, during the first `getAuth()` call. If we inject
  // AFTER the SDK initializes (e.g. via page.evaluate after navigation),
  // the SDK has already checked localStorage and found it empty.
  //
  // Solution: use `context.addInitScript()` to set localStorage BEFORE any
  // page JavaScript executes. The SDK's first `getAuth()` call then finds
  // the auth data, restores the session, and fires `onAuthStateChanged`.
  const storageKey = `firebase:authUser:${FIREBASE_API_KEY}:[DEFAULT]`;
  const userData = {
    uid: authResult.localId,
    email: authResult.email,
    emailVerified: true,
    displayName: null,
    isAnonymous: false,
    photoURL: null,
    phoneNumber: null,
    tenantId: null,
    providerData: [
      {
        uid: authResult.email,
        displayName: null,
        email: authResult.email,
        phoneNumber: null,
        photoURL: null,
        providerId: "password",
      },
    ],
    stsTokenManager: {
      refreshToken: authResult.refreshToken,
      accessToken: authResult.idToken,
      expirationTime:
        Date.now() + Number.parseInt(authResult.expiresIn, 10) * 1000,
    },
    createdAt: String(Date.now()),
    lastLoginAt: String(Date.now()),
    apiKey: FIREBASE_API_KEY,
    appName: "[DEFAULT]",
  };

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  try {
    // Step 3 — navigate to a static asset to establish the correct origin
    // and collect Vercel bypass cookies WITHOUT loading the app's JS bundle.
    //
    // Why not navigate to "/" directly? Firebase SDK v12 uses IndexedDB for
    // auth persistence. On initialization (getAuth()), it reads the legacy
    // localStorage key as a migration path, moves the data to IndexedDB,
    // and CLEARS the localStorage entry. Playwright's storageState() only
    // captures cookies + localStorage (not IndexedDB), so the captured
    // state would have no auth data.
    //
    // By navigating to /favicon.png (a static asset served by Vercel CDN),
    // we get the correct origin and bypass cookies without executing any
    // app JavaScript. We then inject auth data into localStorage and save
    // the storageState immediately — the data stays in localStorage because
    // no SDK code has run to migrate/clear it.
    //
    // When tests load this storageState and navigate to "/", the Firebase
    // SDK finds the auth data in localStorage on its first initialization,
    // restores the session, and fires onAuthStateChanged with the user.
    await page.goto("/favicon.png", {
      waitUntil: "load",
      timeout: TIMEOUTS.appReady,
    });

    // Step 4 — inject auth state into localStorage (no SDK running here)
    await page.evaluate(
      ({ key, value }) => {
        localStorage.setItem(key, value);
      },
      { key: storageKey, value: JSON.stringify(userData) },
    );

    // Step 5 — persist storageState (cookies + localStorage with auth data)
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
