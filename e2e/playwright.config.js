import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const IS_CI = !!process.env.CI;

const VALID_BROWSER_PROFILES = ["chromium", "full"];
const rawBrowserProfile = process.env.E2E_BROWSER_PROFILE;

// Browser profile: 'chromium' (default) or 'full' (all browsers).
// Invalid values fail fast to avoid silently losing cross-browser coverage.
const BROWSER_PROFILE = rawBrowserProfile || "chromium";

if (rawBrowserProfile && !VALID_BROWSER_PROFILES.includes(rawBrowserProfile)) {
  throw new Error(
    `[e2e config] Invalid E2E_BROWSER_PROFILE="${rawBrowserProfile}". ` +
      `Expected one of: ${VALID_BROWSER_PROFILES.join(", ")}.`,
  );
}

const rawWorkers = process.env.E2E_WORKERS;
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const PERCENTAGE_PATTERN = /^(100|[1-9]?\d)%$/;

// Worker count: env-driven with safe fallbacks.
// Accepts positive integers (e.g. "2") and percentage syntax (e.g. "50%").
// Invalid values fail fast with a clear message.
let WORKERS;
if (!rawWorkers) {
  WORKERS = IS_CI ? 1 : undefined;
} else if (POSITIVE_INTEGER_PATTERN.test(rawWorkers)) {
  WORKERS = Number(rawWorkers);
} else if (PERCENTAGE_PATTERN.test(rawWorkers)) {
  WORKERS = rawWorkers;
} else {
  throw new Error(
    `[e2e config] Invalid E2E_WORKERS="${rawWorkers}". ` +
      'Expected a positive integer (e.g. "2") or percentage (e.g. "50%").',
  );
}

const CHROMIUM_PROJECT = {
  name: "chromium",
  use: { ...devices["Desktop Chrome"] },
};

const FIREFOX_PROJECT = {
  name: "firefox",
  use: { ...devices["Desktop Firefox"] },
};

const WEBKIT_PROJECT = {
  name: "webkit",
  use: { ...devices["Desktop Safari"] },
};

const PROJECTS_BY_PROFILE = {
  chromium: [CHROMIUM_PROJECT],
  full: [CHROMIUM_PROJECT, FIREFOX_PROJECT, WEBKIT_PROJECT],
};

export default defineConfig({
  globalSetup: "./global-setup.js",
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 1 : 0,
  workers: WORKERS,
  reporter: IS_CI ? "html" : "list",
  timeout: IS_CI ? 60_000 : 30_000,

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: IS_CI ? 15_000 : 10_000,
    navigationTimeout: IS_CI ? 30_000 : 15_000,
  },

  projects: PROJECTS_BY_PROFILE[BROWSER_PROFILE],
});
