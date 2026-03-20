import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsSuperAdmin } from "./helpers/auth.js";
import { ADMIN, SUPER_ADMIN, isConfigured } from "./helpers/credentials.js";

test.describe("Admin Analytics - Topic Recompute Flow", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isConfigured(ADMIN), "Admin E2E credentials not configured");
    await loginAsAdmin(page);
    await page.goto("/admin");
  });

  test("navigate to Analytics tab and verify topic table structure", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: "Analytics" }).click();

    await expect(page.getByText("Topic Analytics")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Recompute Topics" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Topic" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Count" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Avg Confidence" }),
    ).toBeVisible();
  });

  test("recompute topics shows success alert and refreshes table", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: "Analytics" }).click();

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/admin/analyze-topics") &&
        resp.request().method() === "POST",
      { timeout: 30_000 },
    );

    await page.getByRole("button", { name: "Recompute Topics" }).click();

    await expect(
      page.getByRole("button", { name: "Analyzing..." }),
    ).toBeVisible();

    const response = await responsePromise;
    expect(response.status()).toBeLessThan(400);

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible({ timeout: 10_000 });
    await expect(alert).toContainText("Processed");
    await expect(alert).toContainText("skipped");

    await expect(
      page.getByRole("button", { name: "Recompute Topics" }),
    ).toBeVisible();

    const topicRows = page.locator("table tbody tr");
    const noTopicsMsg = page.getByText("No topics found");

    const hasRows = (await topicRows.count()) > 0;
    const hasEmptyMsg = (await noTopicsMsg.count()) > 0;

    expect(hasRows || hasEmptyMsg).toBeTruthy();
  });

  test("recompute topics button disables during analysis", async ({ page }) => {
    await page.getByRole("tab", { name: "Analytics" }).click();

    await page.getByRole("button", { name: "Recompute Topics" }).click();

    const analyzingBtn = page.getByRole("button", { name: "Analyzing..." });
    await expect(analyzingBtn).toBeDisabled();

    await expect(
      page.getByRole("button", { name: "Recompute Topics" }),
    ).toBeVisible({
      timeout: 30_000,
    });
  });
});

test.describe("Admin Analytics - CSV Export", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isConfigured(ADMIN), "Admin E2E credentials not configured");
    await loginAsAdmin(page);
    await page.goto("/admin");
  });

  test("export CSV triggers file download with correct filename", async ({
    page,
  }) => {
    await expect(page.getByRole("tab", { name: "Requests" })).toBeVisible();

    const downloadPromise = page.waitForEvent("download");

    await page.getByRole("button", { name: "Export CSV" }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("contacts");
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test("export CSV creates valid downloadable blob", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "Requests" })).toBeVisible();

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/admin/export") &&
        resp.request().method() === "GET",
      { timeout: 15_000 },
    );

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV" }).click();

    const response = await responsePromise;
    expect(response.status()).toBeLessThan(400);

    const download = await downloadPromise;
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test("export CSV shows error alert on failure", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "Requests" })).toBeVisible();

    await page.route("**/api/admin/export", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Server error" }),
      }),
    );

    await page.getByRole("button", { name: "Export CSV" }).click();

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible({ timeout: 5_000 });
    await expect(alert).toContainText("CSV export failed");
  });
});

test.describe("Admin Analytics - Super-Admin Management", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !isConfigured(SUPER_ADMIN),
      "Super-admin E2E credentials not configured",
    );
    await loginAsSuperAdmin(page);
    await page.goto("/admin");
  });

  test("Settings tab is visible for super-admin", async ({ page }) => {
    const settingsTab = page.getByRole("tab", { name: "Settings" });
    await expect(settingsTab).toBeVisible({ timeout: 10_000 });
  });

  test("Settings tab shows Manage Admins form", async ({ page }) => {
    await page.getByRole("tab", { name: "Settings" }).click();

    await expect(page.getByText("Manage Admins")).toBeVisible();
    await expect(page.getByPlaceholder("Admin email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Admin" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Remove Admin" }),
    ).toBeVisible();
  });

  test("add admin shows success alert", async ({ page }) => {
    await page.getByRole("tab", { name: "Settings" }).click();

    const testEmail = "e2e-test-admin@example.com";

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/admin/manage-admins") &&
        resp.request().method() === "POST",
      { timeout: 15_000 },
    );

    await page.getByPlaceholder("Admin email").fill(testEmail);
    await page.getByRole("button", { name: "Add Admin" }).click();

    const response = await responsePromise;
    expect(response.status()).toBeLessThan(400);

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible({ timeout: 5_000 });
    await expect(alert).toContainText("Admin added");
    await expect(alert).toContainText(testEmail);

    await expect(page.getByPlaceholder("Admin email")).toHaveValue("");
  });

  test("remove admin shows success alert", async ({ page }) => {
    await page.getByRole("tab", { name: "Settings" }).click();

    const testEmail = "e2e-test-admin@example.com";

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/admin/manage-admins") &&
        resp.request().method() === "POST",
      { timeout: 15_000 },
    );

    await page.getByPlaceholder("Admin email").fill(testEmail);
    await page.getByRole("button", { name: "Remove Admin" }).click();

    const response = await responsePromise;
    expect(response.status()).toBeLessThan(400);

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible({ timeout: 5_000 });
    await expect(alert).toContainText("Admin removed");
    await expect(alert).toContainText(testEmail);

    await expect(page.getByPlaceholder("Admin email")).toHaveValue("");
  });

  test("manage admin shows error alert on failure", async ({ page }) => {
    await page.getByRole("tab", { name: "Settings" }).click();

    await page.route("**/api/admin/manage-admins", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Server error" }),
      }),
    );

    await page.getByPlaceholder("Admin email").fill("fail@example.com");
    await page.getByRole("button", { name: "Add Admin" }).click();

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible({ timeout: 5_000 });
    await expect(alert).toContainText("Failed to update admin");
  });
});

test.describe("Admin Analytics - Settings Tab Visibility", () => {
  test("Settings tab is NOT visible for regular admin", async ({ page }) => {
    test.skip(!isConfigured(ADMIN), "Admin E2E credentials not configured");
    await loginAsAdmin(page);
    await page.goto("/admin");

    await expect(page.getByRole("tab", { name: "Requests" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Analytics" })).toBeVisible();

    await expect(page.getByRole("tab", { name: "Settings" })).not.toBeVisible();
  });
});
