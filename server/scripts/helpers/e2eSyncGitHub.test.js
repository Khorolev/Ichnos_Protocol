import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { spawnSync } from "child_process";
import { syncToGitHub } from "./e2eSyncGitHub.js";

vi.mock("child_process", () => ({
  spawnSync: vi.fn(() => ({ status: 0, stderr: "" })),
}));

vi.mock("./e2eEnvFile.js", () => ({
  maskValue: vi.fn((v) => `${v.slice(0, 2)}***`),
}));

describe("syncToGitHub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("passes cwd option with provided repoRoot", () => {
    syncToGitHub({ SECRET_A: "value-a" }, "/fake/repo");

    expect(spawnSync).toHaveBeenCalledWith(
      "gh",
      ["secret", "set", "SECRET_A"],
      expect.objectContaining({ cwd: "/fake/repo" }),
    );
  });

  it("passes secret value via stdin input option", () => {
    syncToGitHub({ SECRET_A: "my-secret" }, "/fake/repo");

    expect(spawnSync).toHaveBeenCalledWith(
      "gh",
      expect.any(Array),
      expect.objectContaining({ input: "my-secret" }),
    );
  });

  it("constructs correct gh secret set args", () => {
    syncToGitHub({ MY_TOKEN: "tok123" }, "/fake/repo");

    expect(spawnSync).toHaveBeenCalledWith(
      "gh",
      ["secret", "set", "MY_TOKEN"],
      expect.any(Object),
    );
  });

  it("returns success result when spawnSync exits 0", () => {
    const results = syncToGitHub({ SECRET_A: "val" }, "/fake/repo");

    expect(results).toEqual([
      expect.objectContaining({ name: "SECRET_A", status: "success" }),
    ]);
  });

  it("returns failed result with stderr when exit is not 0", () => {
    spawnSync.mockReturnValueOnce({ status: 1, stderr: "permission denied" });

    const results = syncToGitHub({ SECRET_A: "val" }, "/fake/repo");

    expect(results).toEqual([
      expect.objectContaining({
        name: "SECRET_A",
        status: "failed",
        error: "permission denied",
      }),
    ]);
  });

  it("skips empty/falsy credential values", () => {
    syncToGitHub(
      { EMPTY: "", NULL_VAL: null, UNDEF_VAL: undefined },
      "/fake/repo",
    );

    expect(spawnSync).not.toHaveBeenCalled();
  });

  it("collects results for multiple credentials, skipping empty ones", () => {
    const results = syncToGitHub(
      { A: "val-a", B: "", C: "val-c" },
      "/fake/repo",
    );

    expect(results).toHaveLength(2);
    expect(results[0].name).toBe("A");
    expect(results[1].name).toBe("C");
    expect(spawnSync).toHaveBeenCalledTimes(2);
  });

  it("throws when repoRoot is missing", () => {
    expect(() => syncToGitHub({ SECRET_A: "val" })).toThrow(
      /repoRoot is required/,
    );
  });

  it("throws when repoRoot is empty string", () => {
    expect(() => syncToGitHub({ SECRET_A: "val" }, "")).toThrow(
      /repoRoot is required/,
    );
  });

  it("returns error from result.error.message when stderr is empty", () => {
    spawnSync.mockReturnValueOnce({
      status: 1,
      stderr: "",
      error: new Error("spawn ENOENT"),
    });

    const results = syncToGitHub({ SECRET_A: "val" }, "/fake/repo");

    expect(results).toEqual([
      expect.objectContaining({
        name: "SECRET_A",
        status: "failed",
        error: "spawn ENOENT",
      }),
    ]);
  });

  it("returns fallback message when both stderr and error are absent", () => {
    spawnSync.mockReturnValueOnce({
      status: 1,
      stderr: "",
    });

    const results = syncToGitHub({ SECRET_A: "val" }, "/fake/repo");

    expect(results).toEqual([
      expect.objectContaining({
        name: "SECRET_A",
        status: "failed",
        error: "Unknown error: process exited with non-zero status",
      }),
    ]);
  });
});
