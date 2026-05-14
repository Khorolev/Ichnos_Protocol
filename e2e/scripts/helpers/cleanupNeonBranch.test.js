import { describe, it, expect, vi } from "vitest";

import {
  selectBranchesToDelete,
  listBranches,
  deleteBranch,
} from "./cleanupNeonBranch.js";

describe("selectBranchesToDelete", () => {
  const baseBranches = [
    { id: "br-main", name: "main", primary: true },
    { id: "br-prod", name: "production", protected: true },
    { id: "br-staging", name: "staging" },
    { id: "br-preview-main", name: "preview/main" },
    { id: "br-preview-feat", name: "preview/feature/foo" },
    { id: "br-preview-feat-2", name: "preview/feature/foo-abc123" },
    { id: "br-preview-other", name: "preview/feature/bar" },
    { id: "br-weird", name: "something-else" },
  ];

  it("returns branches exactly matching preview/{gitBranch}", () => {
    const result = selectBranchesToDelete(baseBranches, "feature/foo");
    const ids = result.map((b) => b.id);
    expect(ids).toContain("br-preview-feat");
  });

  it("returns branches starting with preview/{gitBranch}- (deployment suffix)", () => {
    const result = selectBranchesToDelete(baseBranches, "feature/foo");
    const ids = result.map((b) => b.id);
    expect(ids).toContain("br-preview-feat-2");
  });

  it("does not return branches for a different git branch", () => {
    const result = selectBranchesToDelete(baseBranches, "feature/foo");
    const ids = result.map((b) => b.id);
    expect(ids).not.toContain("br-preview-other");
  });

  it("never returns primary branches even if they match the pattern", () => {
    const branches = [
      { id: "br-primary", name: "preview/main", primary: true },
    ];
    expect(selectBranchesToDelete(branches, "main")).toEqual([]);
  });

  it("never returns protected branches even if they match the pattern", () => {
    const branches = [
      { id: "br-protected", name: "preview/main", protected: true },
    ];
    expect(selectBranchesToDelete(branches, "main")).toEqual([]);
  });

  it("never returns branches literally named main/production/staging", () => {
    const branches = [
      { id: "br-main", name: "main" },
      { id: "br-prod", name: "production" },
      { id: "br-staging", name: "staging" },
    ];
    expect(selectBranchesToDelete(branches, "main")).toEqual([]);
    expect(selectBranchesToDelete(branches, "production")).toEqual([]);
    expect(selectBranchesToDelete(branches, "staging")).toEqual([]);
  });

  it("returns preview/main when gitBranch is main", () => {
    const result = selectBranchesToDelete(baseBranches, "main");
    expect(result.map((b) => b.id)).toEqual(["br-preview-main"]);
  });

  it("returns empty array when gitBranch is falsy", () => {
    expect(selectBranchesToDelete(baseBranches, "")).toEqual([]);
    expect(selectBranchesToDelete(baseBranches, null)).toEqual([]);
    expect(selectBranchesToDelete(baseBranches, undefined)).toEqual([]);
  });

  it("returns empty array when branches is not an array", () => {
    expect(selectBranchesToDelete(null, "main")).toEqual([]);
    expect(selectBranchesToDelete(undefined, "main")).toEqual([]);
    expect(selectBranchesToDelete({}, "main")).toEqual([]);
  });

  it("skips malformed branch entries (missing name)", () => {
    const branches = [
      { id: "br-ok", name: "preview/main" },
      { id: "br-bad" },
      null,
      { id: "br-bad2", name: 42 },
    ];
    const result = selectBranchesToDelete(branches, "main");
    expect(result.map((b) => b.id)).toEqual(["br-ok"]);
  });
});

describe("listBranches", () => {
  it("calls the Neon API with Bearer auth and returns the branches array", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        branches: [{ id: "br-1", name: "main" }],
      }),
    });

    const result = await listBranches(mockFetch, {
      apiKey: "key-123",
      projectId: "proj-abc",
    });

    expect(result).toEqual([{ id: "br-1", name: "main" }]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "https://console.neon.tech/api/v2/projects/proj-abc/branches",
    );
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBe("Bearer key-123");
  });

  it("returns empty array when API returns no branches key", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const result = await listBranches(mockFetch, {
      apiKey: "k",
      projectId: "p",
    });
    expect(result).toEqual([]);
  });

  it("throws on non-2xx response with HTTP status in message", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => "bad api key",
    });

    await expect(() =>
      listBranches(mockFetch, { apiKey: "k", projectId: "p" }),
    ).rejects.toThrowError(/HTTP 401/);
  });
});

describe("deleteBranch", () => {
  it("issues a DELETE with Bearer auth", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    const result = await deleteBranch(mockFetch, {
      apiKey: "key-123",
      projectId: "proj-abc",
      branchId: "br-xyz",
    });

    expect(result).toEqual({ ok: true, status: 200 });
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "https://console.neon.tech/api/v2/projects/proj-abc/branches/br-xyz",
    );
    expect(init.method).toBe("DELETE");
    expect(init.headers.Authorization).toBe("Bearer key-123");
  });

  it("treats HTTP 404 as idempotent success", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => "branch not found",
    });

    const result = await deleteBranch(mockFetch, {
      apiKey: "k",
      projectId: "p",
      branchId: "br-gone",
    });
    expect(result).toEqual({ ok: true, status: 404 });
  });

  it("throws on other non-2xx responses", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "neon exploded",
    });

    await expect(() =>
      deleteBranch(mockFetch, {
        apiKey: "k",
        projectId: "p",
        branchId: "br-x",
      }),
    ).rejects.toThrowError(/HTTP 500/);
  });
});
