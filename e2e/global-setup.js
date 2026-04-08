/**
 * Playwright global setup — validates that configured E2E Firebase accounts
 * can sign in before running tests, then generates storageState files for
 * each configured role.
 *
 * Firebase SDK v12 stores auth persistence data in IndexedDB
 * (`firebaseLocalStorageDb`, object store `firebaseLocalStorage`) and no
 * longer reads from localStorage. Auth state is bootstrapped via the
 * Firebase REST API + IndexedDB injection — no login UI interaction.
 *
 * Strategy (two-navigation pattern):
 *   1. Navigate to `/favicon.png` — a static asset that establishes the
 *      correct origin and collects Vercel bypass cookies without loading
 *      app JS or initializing the Firebase SDK.
 *   2. Write auth data directly to IndexedDB via `page.evaluate()`.
 *   3. Navigate to `/` so the Firebase SDK initializes and reads auth
 *      data from IndexedDB.
 *   4. Wait for `user-menu-toggle` visibility to confirm the session was
 *      restored before saving `storageState`.
 *
 * This keeps auth-UI specs (auth.spec.js, login.spec.js) independently
 * runnable even when the login modal has regressions.
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
const API_BASE_URL = process.env.E2E_API_BASE_URL || "http://localhost:3001";

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
 * 2. Opening a browser context, navigating to a static asset (`/favicon.png`)
 *    to establish the correct origin and collect Vercel bypass cookies
 *    without executing app JS.
 * 3. Writing Firebase auth data directly to IndexedDB
 *    (`firebaseLocalStorageDb` / `firebaseLocalStorage`) via `page.evaluate()`.
 * 4. Navigating to `/` so Firebase SDK initializes and establishes a full
 *    auth session from IndexedDB.
 * 5. Verifying auth via `user-menu-toggle` visibility (non-fatal on timeout).
 * 6. Saving the resulting `storageState` (with `indexedDB: true`) to disk.
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

  // Step 2 — build the auth data for IndexedDB injection.
  //
  // Firebase SDK v12 stores auth data in IndexedDB database
  // `firebaseLocalStorageDb`, object store `firebaseLocalStorage`.
  // Each record has the shape: { fbase_key: "<storageKey>", value: <authDataObject> }.
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
    // and collect Vercel bypass cookies without loading app JS.
    await page.goto("/favicon.png", {
      waitUntil: "load",
      timeout: TIMEOUTS.appReady,
    });

    // Step 4 — write auth data to IndexedDB where Firebase SDK expects it
    await page.evaluate(
      ({ key, value }) => {
        return new Promise((resolve, reject) => {
          const request = indexedDB.open("firebaseLocalStorageDb", 1);

          request.onerror = () => reject(request.error);

          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains("firebaseLocalStorage")) {
              db.createObjectStore("firebaseLocalStorage", {
                keyPath: "fbase_key",
              });
            }
          };

          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction("firebaseLocalStorage", "readwrite");
            const store = tx.objectStore("firebaseLocalStorage");
            store.put({ fbase_key: key, value: value });

            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onabort = () => {
              db.close();
              reject(tx.error || new Error("IndexedDB transaction aborted"));
            };
            tx.onerror = () => {
              db.close();
              reject(tx.error);
            };
          };
        });
      },
      { key: storageKey, value: userData },
    );

    // Step 5 — navigate to the app so Firebase SDK reads from IndexedDB
    // and establishes a full auth session (tokens, cookies, SDK state).
    await page.goto("/", {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUTS.appReady,
    });

    // Step 6 — verify auth session was restored. Non-fatal: if verification
    // times out, save the state anyway (IndexedDB data may still work).
    try {
      await page
        .getByTestId("user-menu-toggle")
        .first()
        .waitFor({ state: "visible", timeout: TIMEOUTS.authVerify });
      console.log(
        `[global-setup] Auth verified for ${role.label} (user-menu-toggle visible)`,
      );
    } catch {
      // Capture diagnostic info: page URL, visible text, and server getMe response
      const url = page.url();
      const bodyText = await page
        .locator("body")
        .innerText({ timeout: 5000 })
        .catch(() => "(could not read body)");
      const snippet = bodyText.substring(0, 500);

      // Diagnostic: call getMe directly with the REST token to see what the server says
      const getMeHeaders = {
        Authorization: `Bearer ${authResult.idToken}`,
        ...(BYPASS_SECRET && {
          "x-vercel-protection-bypass": BYPASS_SECRET,
        }),
      };
      const getMeRes = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: getMeHeaders,
      }).catch((err) => ({ status: "fetch-error", statusText: err.message }));
      const getMeBody = getMeRes.json
        ? await getMeRes.json().catch(() => "(non-JSON)")
        : "(no body)";

      console.warn(
        `[global-setup] ⚠ Auth verification timed out for ${role.label}.\n` +
          `  URL: ${url}\n` +
          `  Page snippet: ${snippet}\n` +
          `  getMe status: ${getMeRes.status}\n` +
          `  getMe body: ${JSON.stringify(getMeBody)}`,
      );
    }

    // Step 7 — persist storageState (cookies + localStorage + IndexedDB).
    const statePath = path.join(AUTH_DIR, role.file);
    await context.storageState({ path: statePath, indexedDB: true });

    // Diagnostic: verify the saved file contains IndexedDB data
    const stateContent = JSON.parse(fs.readFileSync(statePath, "utf-8"));
    const hasIDB = Array.isArray(stateContent.indexedDB) && stateContent.indexedDB.length > 0;
    const idbSummary = hasIDB
      ? stateContent.indexedDB.map((db) => `${db.name}(${db.stores?.length || 0} stores)`).join(", ")
      : "NONE";
    const cookieCount = stateContent.cookies?.length || 0;
    const lsCount = stateContent.origins?.reduce((n, o) => n + (o.localStorage?.length || 0), 0) || 0;
    console.log(
      `[global-setup] StorageState saved for ${role.label} → ${role.file} ` +
        `(cookies: ${cookieCount}, localStorage: ${lsCount}, indexedDB: ${idbSummary})`,
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
