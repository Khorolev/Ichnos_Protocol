import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { existsSync, readFileSync } from "fs";
import { execFileSync } from "child_process";

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock("child_process", () => ({
  execFileSync: vi.fn(),
}));

const {
  checkGhAuth,
  checkVercelAuth,
  checkVercelProject,
  checkFirebaseEnv,
} = await import("./e2ePreflightChecks.js");

const SERVER_DIR = "/fake/server";

describe("checkGhAuth", () => {
  it("passes when gh auth status succeeds", () => {
    execFileSync.mockReturnValue("");
    expect(() => checkGhAuth()).not.toThrow();
  });

  it("throws when gh auth status fails", () => {
    execFileSync.mockImplementation(() => {
      throw new Error("not logged in");
    });
    expect(() => checkGhAuth()).toThrow(/GitHub CLI is not authenticated/);
  });
});

describe("checkVercelAuth", () => {
  it("passes when vercel whoami succeeds", () => {
    execFileSync.mockReturnValue("");
    expect(() => checkVercelAuth()).not.toThrow();
  });

  it("throws when vercel whoami fails", () => {
    execFileSync.mockImplementation(() => {
      throw new Error("not logged in");
    });
    expect(() => checkVercelAuth()).toThrow(
      /Vercel CLI is not authenticated/,
    );
  });
});

describe("checkVercelProject", () => {
  beforeEach(() => {
    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue(
      JSON.stringify({ projectId: "prj_123", orgId: "org_456", projectName: "ichnos-protocol_server" }),
    );
  });

  it("passes with valid project.json and matching project name", () => {
    expect(() => checkVercelProject(SERVER_DIR)).not.toThrow();
  });

  it("throws when project.json does not exist", () => {
    existsSync.mockReturnValue(false);
    expect(() => checkVercelProject(SERVER_DIR)).toThrow(
      /project\.json not found/,
    );
  });

  it("throws when project.json is malformed JSON", () => {
    readFileSync.mockReturnValue("not-json{");
    expect(() => checkVercelProject(SERVER_DIR)).toThrow(
      /project\.json is malformed/,
    );
  });

  it("throws actionable error when project.json contains valid JSON null", () => {
    readFileSync.mockReturnValue("null");
    expect(() => checkVercelProject(SERVER_DIR)).toThrow(
      /project\.json is malformed/,
    );
  });

  it("throws when projectId is missing", () => {
    readFileSync.mockReturnValue(JSON.stringify({ orgId: "org_456", projectName: "ichnos-protocol_server" }));
    expect(() => checkVercelProject(SERVER_DIR)).toThrow(
      /missing projectId or orgId/,
    );
  });

  it("throws when orgId is missing", () => {
    readFileSync.mockReturnValue(
      JSON.stringify({ projectId: "prj_123", projectName: "ichnos-protocol_server" }),
    );
    expect(() => checkVercelProject(SERVER_DIR)).toThrow(
      /missing projectId or orgId/,
    );
  });

  it("throws when projectName is absent", () => {
    readFileSync.mockReturnValue(
      JSON.stringify({ projectId: "prj_123", orgId: "org_456" }),
    );
    expect(() => checkVercelProject(SERVER_DIR)).toThrow(/does not contain a valid projectName/);
  });

  it("throws when projectName is a truthy non-string value", () => {
    readFileSync.mockReturnValue(
      JSON.stringify({ projectId: "prj_123", orgId: "org_456", projectName: 12345 }),
    );
    expect(() => checkVercelProject(SERVER_DIR)).toThrow(
      /does not contain a valid projectName/,
    );
  });

  it("throws when projectName does not match expected identity", () => {
    readFileSync.mockReturnValue(
      JSON.stringify({ projectId: "prj_123", orgId: "org_456", projectName: "wrong-project" }),
    );
    expect(() => checkVercelProject(SERVER_DIR)).toThrow(
      /does not match the expected server project/,
    );
  });

  it("throws when projectName is the stale deleted 'ichnos-protocolserver'", () => {
    readFileSync.mockReturnValue(
      JSON.stringify({ projectId: "prj_123", orgId: "org_456", projectName: "ichnos-protocolserver" }),
    );
    expect(() => checkVercelProject(SERVER_DIR)).toThrow(
      /does not match the expected server project/,
    );
  });

  it("throws when projectName is a substring match like my-server-project", () => {
    readFileSync.mockReturnValue(
      JSON.stringify({ projectId: "prj_123", orgId: "org_456", projectName: "my-server-project" }),
    );
    expect(() => checkVercelProject(SERVER_DIR)).toThrow(
      /does not match the expected server project/,
    );
  });

  it("throws when projectName has wrong casing", () => {
    readFileSync.mockReturnValue(
      JSON.stringify({ projectId: "prj_123", orgId: "org_456", projectName: "ichnos-protocolServer" }),
    );
    expect(() => checkVercelProject(SERVER_DIR)).toThrow(
      /does not match the expected server project/,
    );
  });

  it("throws when projectName is a client project", () => {
    readFileSync.mockReturnValue(
      JSON.stringify({ projectId: "prj_123", orgId: "org_456", projectName: "ichnos-client" }),
    );
    expect(() => checkVercelProject(SERVER_DIR)).toThrow(
      /does not match the expected server project/,
    );
  });

  it("throws when projectName is empty string", () => {
    readFileSync.mockReturnValue(
      JSON.stringify({ projectId: "prj_123", orgId: "org_456", projectName: "" }),
    );
    expect(() => checkVercelProject(SERVER_DIR)).toThrow(
      /does not contain a valid projectName/,
    );
  });
});

describe("checkFirebaseEnv", () => {
  const requiredVars = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
  ];
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("passes when all Firebase env vars are set", () => {
    for (const key of requiredVars) process.env[key] = "value";
    expect(() => checkFirebaseEnv()).not.toThrow();
  });

  it("throws when all Firebase env vars are missing", () => {
    for (const key of requiredVars) delete process.env[key];
    expect(() => checkFirebaseEnv()).toThrow(
      /Missing Firebase Admin SDK env vars/,
    );
  });

  it("lists each missing var in the error message", () => {
    delete process.env.FIREBASE_PROJECT_ID;
    process.env.FIREBASE_CLIENT_EMAIL = "val";
    delete process.env.FIREBASE_PRIVATE_KEY;
    expect(() => checkFirebaseEnv()).toThrow(
      /FIREBASE_PROJECT_ID.*FIREBASE_PRIVATE_KEY/,
    );
  });
});
