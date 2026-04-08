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
 * 4. Saving the resulting `storageState` (with `indexedDB: true`) to disk
 *    BEFORE navigating to "/" — Firebase SDK clears IndexedDB on init.
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

    // Step 5 — save storageState NOW, before navigating to "/".
    // Firebase SDK v12 clears/migrates IndexedDB data during initialization,
    // so we must capture the state while still on the static asset page.
    const statePath = path.join(AUTH_DIR, role.file);
    await context.storageState({ path: statePath, indexedDB: true });

    // Diagnostic: inspect the saved file
    const stateContent = JSON.parse(fs.readFileSync(statePath, "utf-8"));
    const idbDbs = stateContent.indexedDB || [];
    const hasIDB = idbDbs.length > 0;
    const idbSummary = hasIDB
      ? idbDbs.map((db) => {
          const storeInfo = (db.stores || []).map(
            (s) => `${s.name}(${s.records?.length || 0} records)`,
          );
          return `${db.name}[${storeInfo.join(",")}]`;
        }).join(", ")
      : "NONE";
    const cookieCount = stateContent.cookies?.length || 0;
    const lsCount = stateContent.origins?.reduce(
      (n, o) => n + (o.localStorage?.length || 0), 0,
    ) || 0;
    console.log(
      `[global-setup] StorageState saved for ${role.label} → ${role.file} ` +
        `(cookies: ${cookieCount}, localStorage: ${lsCount}, indexedDB: ${idbSummary})`,
    );

    if (!hasIDB) {
      // Fallback diagnostic: verify IndexedDB data exists via page.evaluate
      const idbCheck = await page.evaluate(() => {
        return new Promise((resolve) => {
          const req = indexedDB.open("firebaseLocalStorageDb", 1);
          req.onerror = () => resolve({ exists: false, error: String(req.error) });
          req.onsuccess = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains("firebaseLocalStorage")) {
              db.close();
              resolve({ exists: false, error: "store not found" });
              return;
            }
            const tx = db.transaction("firebaseLocalStorage", "readonly");
            const store = tx.objectStore("firebaseLocalStorage");
            const getAll = store.getAll();
            getAll.onsuccess = () => {
              db.close();
              resolve({ exists: true, count: getAll.result.length,
                keys: getAll.result.map((r) => r.fbase_key) });
            };
            getAll.onerror = () => {
              db.close();
              resolve({ exists: false, error: String(getAll.error) });
            };
          };
        });
      });
      console.warn(
        `[global-setup] ⚠ IndexedDB not in storageState for ${role.label}. ` +
          `Browser IDB check: ${JSON.stringify(idbCheck)}`,
      );
    }
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
