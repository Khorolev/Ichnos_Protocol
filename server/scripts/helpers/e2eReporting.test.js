import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { printFailedDetails, printSummary } from "./e2eReporting.js";

describe("printFailedDetails", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does nothing when all results succeeded", () => {
    printFailedDetails("GitHub", [
      { name: "E2E_ADMIN_EMAIL", status: "ok" },
      { name: "E2E_ADMIN_PASSWORD", status: "ok" },
    ]);

    expect(console.error).not.toHaveBeenCalled();
  });

  it("prints failed count and variable names for GitHub", () => {
    printFailedDetails("GitHub", [
      { name: "E2E_ADMIN_EMAIL", status: "ok" },
      { name: "E2E_USER_EMAIL", status: "failed", error: "403 Forbidden" },
    ]);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("GitHub sync failed for 1 variable(s)")
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("E2E_USER_EMAIL: 403 Forbidden")
    );
  });

  it("prints failed count and variable names for Vercel", () => {
    printFailedDetails("Vercel", [
      { name: "E2E_ADMIN_UID", status: "failed", error: "Not found" },
      { name: "E2E_USER_UID", status: "failed", error: "Timeout" },
    ]);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Vercel sync failed for 2 variable(s)")
    );
  });

  it("sanitizes multiline errors to first line only", () => {
    printFailedDetails("GitHub", [
      { name: "MULTI_VAR", status: "failed", error: "Line one\nLine two\nLine three" },
    ]);

    const varCall = console.error.mock.calls.find(
      (c) => typeof c[0] === "string" && c[0].includes("MULTI_VAR:")
    );
    expect(varCall[0]).toContain("Line one");
    expect(varCall[0]).not.toContain("Line two");
  });

  it("truncates long error lines to 200 characters", () => {
    const longError = "x".repeat(300);

    printFailedDetails("GitHub", [
      { name: "LONG_VAR", status: "failed", error: longError },
    ]);

    const varCall = console.error.mock.calls.find(
      (c) => typeof c[0] === "string" && c[0].includes("LONG_VAR:")
    );
    const detail = varCall[0].split("LONG_VAR: ")[1];
    expect(detail.length).toBeLessThanOrEqual(200);
  });

  it("handles missing error field with 'unknown error'", () => {
    printFailedDetails("GitHub", [
      { name: "NO_ERR_VAR", status: "failed" },
    ]);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("NO_ERR_VAR: unknown error")
    );
  });

  it("trims whitespace from error before splitting", () => {
    printFailedDetails("GitHub", [
      { name: "TRIM_VAR", status: "failed", error: "  \n  Actual error\nMore" },
    ]);

    const varCall = console.error.mock.calls.find(
      (c) => typeof c[0] === "string" && c[0].includes("TRIM_VAR:")
    );
    expect(varCall[0]).toContain("Actual error");
    expect(varCall[0]).not.toContain("More");
  });
});

describe("printSummary", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints section headers for both GitHub and Vercel", () => {
    printSummary(
      [{ name: "E2E_ADMIN_EMAIL", status: "ok", masked: "a***@t.com" }],
      [{ name: "E2E_ADMIN_UID", status: "ok", masked: "uid-***" }]
    );

    const allOutput = console.log.mock.calls.map((c) => c[0]).join("\n");
    expect(allOutput).toContain("GitHub Actions Secrets");
    expect(allOutput).toContain("Vercel Preview Env Vars");
    expect(allOutput).toContain("E2E Credential Sync Summary");
  });

  it("renders each result with name, status, and masked value", () => {
    printSummary(
      [{ name: "E2E_ADMIN_EMAIL", status: "ok", masked: "a***@t.com" }],
      []
    );

    const resultLine = console.log.mock.calls.find(
      (c) => typeof c[0] === "string" && c[0].includes("E2E_ADMIN_EMAIL")
    );
    expect(resultLine).toBeDefined();
    expect(resultLine[0]).toContain("ok");
    expect(resultLine[0]).toContain("a***@t.com");
  });

  it("renders inline error for failed results", () => {
    printSummary(
      [],
      [{ name: "E2E_USER_UID", status: "failed", masked: "", error: "API error\ndetails" }]
    );

    const errorLine = console.log.mock.calls.find(
      (c) => typeof c[0] === "string" && c[0].includes("error:")
    );
    expect(errorLine).toBeDefined();
    expect(errorLine[0]).toContain("API error");
    expect(errorLine[0]).not.toContain("details");
  });

  it("does not render error line for successful results", () => {
    printSummary(
      [{ name: "OK_VAR", status: "ok", masked: "***" }],
      []
    );

    const errorLine = console.log.mock.calls.find(
      (c) => typeof c[0] === "string" && c[0].includes("error:")
    );
    expect(errorLine).toBeUndefined();
  });
});
