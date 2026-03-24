import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";

function fail(message, remediation) {
  throw new Error(`${message}\nRemediation: ${remediation}`);
}

export function checkGhAuth() {
  try {
    execFileSync("gh", ["auth", "status"], { stdio: "pipe" });
  } catch {
    fail(
      "GitHub CLI is not authenticated.",
      "Run `gh auth login` to authenticate the GitHub CLI.",
    );
  }
}

export function checkVercelAuth() {
  try {
    execFileSync("vercel", ["whoami"], { stdio: "pipe" });
  } catch {
    fail(
      "Vercel CLI is not authenticated.",
      "Run `vercel login` to authenticate the Vercel CLI.",
    );
  }
}

function resolveProjectJsonPath(serverDir) {
  const projectJsonPath = join(serverDir, ".vercel", "project.json");
  if (!existsSync(projectJsonPath)) {
    fail(
      "server/.vercel/project.json not found.",
      "Run `cd server && vercel link` to link the server project.",
    );
  }
  return projectJsonPath;
}

function parseProjectJson(projectJsonPath) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(projectJsonPath, "utf8"));
  } catch {
    fail(
      "server/.vercel/project.json is malformed.",
      "Run `cd server && vercel link` to re-link the server project.",
    );
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    fail(
      "server/.vercel/project.json is malformed.",
      "Run `cd server && vercel link` to re-link the server project.",
    );
  }
  return parsed;
}

function validateProjectMetadata(projectJson) {
  if (!projectJson.projectId || !projectJson.orgId) {
    fail(
      "server/.vercel/project.json is missing projectId or orgId.",
      "Run `cd server && vercel link` to re-link the server project.",
    );
  }
}

export function checkVercelProject(serverDir) {
  const projectJsonPath = resolveProjectJsonPath(serverDir);
  const projectJson = parseProjectJson(projectJsonPath);
  validateProjectMetadata(projectJson);

  if (!projectJson.projectName || typeof projectJson.projectName !== "string") {
    fail(
      "server/.vercel/project.json does not contain a valid projectName.",
      "Run `cd server && vercel link` with the latest Vercel CLI to re-link the server project.",
    );
  }

  if (projectJson.projectName !== "ichnos-protocolserver") {
    fail(
      `Linked Vercel project '${projectJson.projectName}' does not match the expected server project 'ichnos-protocolserver'.`,
      "Run `cd server && vercel link` and select the 'ichnos-protocolserver' project.",
    );
  }
}

export function checkFirebaseEnv() {
  const required = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    fail(
      `Missing Firebase Admin SDK env vars: ${missing.join(", ")}.`,
      "Ensure server/.env contains the Firebase Admin SDK credentials.",
    );
  }
}
