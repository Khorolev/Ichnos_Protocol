import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth.js";
import { ADMIN, isConfigured } from "./helpers/credentials.js";

test.describe("Admin Kanban - Basic Flow", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isConfigured(ADMIN), "Admin E2E credentials not configured");
    await loginAsAdmin(page);
    await page.goto("/admin");
  });

  test("Requests tab and Inquiries board are visible", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "Requests" })).toBeVisible();
    await expect(page.getByText("Inquiries Board")).toBeVisible();
  });

  test("expand first lane and verify request columns", async ({ page }) => {
    const expandButtons = page.getByRole("button", { name: "Expand" });
    const firstExpand = expandButtons.first();

    const hasExpandButtons = (await expandButtons.count()) > 0;

    if (!hasExpandButtons) {
      await expect(page.getByText("Inquiries Board")).toBeVisible();
      return;
    }

    await firstExpand.click();

    const newCol = page.getByText("new");
    const inProgressCol = page.getByText("in progress");
    const contactedCol = page.getByText("contacted");

    const anyVisible =
      (await newCol.isVisible().catch(() => false)) ||
      (await inProgressCol.isVisible().catch(() => false)) ||
      (await contactedCol.isVisible().catch(() => false));

    expect(anyVisible).toBeTruthy();
  });
});

test.describe("Admin Kanban - Request Edit Flow", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isConfigured(ADMIN), "Admin E2E credentials not configured");
    await loginAsAdmin(page);
    await page.goto("/admin");
  });

  test("open timeline drawer and edit a request", async ({ page }) => {
    const laneRow = page
      .locator('[role="button"]', { hasText: "Inquiries:" })
      .first();
    await expect(laneRow).toBeVisible({ timeout: 10_000 });
    await laneRow.click();

    await expect(page.getByTestId("timeline-drawer")).toBeVisible({
      timeout: 5_000,
    });

    const listItems = page.getByTestId("timeline-drawer").getByRole("listitem");
    const hasItems = (await listItems.count()) > 0;

    if (!hasItems) {
      await expect(page.getByTestId("timeline-drawer")).toBeVisible();
      return;
    }

    await listItems.first().click();

    await expect(page.getByLabel("Status")).toBeVisible();
    await expect(page.getByLabel("Admin Notes")).toBeVisible();

    await page.getByLabel("Status").selectOption("contacted");
    await page.getByLabel("Admin Notes").fill("E2E test note");

    const saveResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/admin/request") &&
        resp.request().method() === "PUT",
      { timeout: 15_000 },
    );
    await page.getByRole("button", { name: "Save" }).click();

    const saveResponse = await saveResponsePromise;
    expect(saveResponse.status()).toBeLessThan(400);

    await expect(page.getByRole("button", { name: "Save" })).not.toBeVisible({
      timeout: 5_000,
    });

    await listItems.first().click();
    await expect(page.getByLabel("Status")).toBeVisible();
    await expect(page.getByLabel("Status")).toHaveValue("contacted");
    await expect(page.getByLabel("Admin Notes")).toHaveValue("E2E test note");
  });
});

test.describe("Admin Kanban - Chat-only Leads", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isConfigured(ADMIN), "Admin E2E credentials not configured");
    await loginAsAdmin(page);
    await page.goto("/admin");
  });

  test("switch to Chat-only Leads sub-tab and verify table", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "Chat-only Leads" }).click();

    await expect(
      page.getByRole("columnheader", { name: "Name" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Email" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Total Messages" }),
    ).toBeVisible();
  });

  test("open chat lead drawer and verify Q&A", async ({ page }) => {
    await page.getByRole("link", { name: "Chat-only Leads" }).click();

    const rows = page.locator("tbody tr");
    const hasRows = (await rows.count()) > 0;

    if (!hasRows) {
      await expect(
        page.getByRole("columnheader", { name: "Name" }),
      ).toBeVisible();
      return;
    }

    await rows.first().click();

    await expect(page.getByText("Chat History")).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByTestId("chat-drawer")).toBeVisible();

    const qaPrefix = page.getByText(/^Q:/);
    await expect(qaPrefix.first()).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("Admin - Topic Analytics", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isConfigured(ADMIN), "Admin E2E credentials not configured");
    await loginAsAdmin(page);
    await page.goto("/admin");
  });

  test("switch to Analytics tab and see topic table", async ({ page }) => {
    await page.getByRole("tab", { name: "Analytics" }).click();

    await expect(page.getByText("Topic Analytics")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Recompute Topics" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Topic" }),
    ).toBeVisible();
  });

  test("recompute topics triggers analysis", async ({ page }) => {
    await page.getByRole("tab", { name: "Analytics" }).click();

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/admin/analyze-topics") &&
        resp.request().method() === "POST",
      { timeout: 30_000 },
    );

    await page.getByRole("button", { name: "Recompute Topics" }).click();

    const response = await responsePromise;
    expect(response.status()).toBeLessThan(400);
  });
});

test.describe("Admin - CSV Export", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isConfigured(ADMIN), "Admin E2E credentials not configured");
    await loginAsAdmin(page);
    await page.goto("/admin");
  });

  test("export CSV triggers download", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");

    await page.getByRole("button", { name: "Export CSV" }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("contacts");
  });
});

test.describe("Admin Kanban - Request Delete Flow", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isConfigured(ADMIN), "Admin E2E credentials not configured");
    await loginAsAdmin(page);
    await page.goto("/admin");
  });

  test("delete a request from timeline drawer", async ({ page }) => {
    const laneRow = page
      .locator('[role="button"]', { hasText: "Inquiries:" })
      .first();
    await expect(laneRow).toBeVisible({ timeout: 10_000 });
    await laneRow.click();

    await expect(page.getByTestId("timeline-drawer")).toBeVisible({
      timeout: 5_000,
    });

    const listItems = page.getByTestId("timeline-drawer").getByRole("listitem");
    const hasItems = (await listItems.count()) > 0;

    if (!hasItems) {
      await expect(page.getByTestId("timeline-drawer")).toBeVisible();
      return;
    }

    await listItems.first().click();

    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();

    await page.route("**/api/admin/request/**", (route) => {
      if (route.request().method() === "DELETE") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: { success: true },
            message: "Request deleted",
          }),
        });
      }
      return route.continue();
    });

    await page.evaluate(() => {
      window.confirm = () => true;
    });

    const deleteResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/admin/request") &&
        resp.request().method() === "DELETE",
      { timeout: 15_000 },
    );
    await page.getByRole("button", { name: "Delete" }).click();
    const resp = await deleteResponse;
    expect(resp.status()).toBeLessThan(400);

    await expect(page.getByRole("button", { name: "Delete" })).not.toBeVisible({
      timeout: 5_000,
    });
  });
});
