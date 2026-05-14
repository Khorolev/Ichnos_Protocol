import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Defensive lock on the streaming timeouts.
 *
 * The xAI RAG stream timeouts have been set deliberately high so that a
 * growing knowledge base can produce long, high-quality streams without
 * being killed mid-response. This test guards against accidental regression
 * to small values (a recurring failure mode — see git history around
 * commit `XAI_TIMEOUT_MS = 9500` killing healthy 11s streams).
 *
 * Invariants:
 *   - Total stream timeout sits just under the Vercel Pro function ceiling
 *     (maxDuration: 300 in server/api/index.js), so the server gets a chance
 *     to clean up before Vercel kills the function.
 *   - Idle timeout (max silence between chunks) is generous enough for
 *     Grok with long RAG context to pause noticeably between tokens.
 *   - api/index.js explicitly exports `config.maxDuration = 300` so the
 *     runtime budget is locked. (maxDuration is declared in the entry file,
 *     not in vercel.json, because the project uses the legacy `builds`
 *     configuration and Vercel rejects a `functions` block alongside `builds`
 *     with the "Conflicting Functions and Builds Configuration" error.)
 *
 * This test reads the source files as text rather than importing them so
 * that the assertion does not pull in Firebase config initialisation as a
 * side effect of `import chatService.js`.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CHAT_SERVICE_PATH = path.resolve(__dirname, "./chatService.js");
const API_ENTRY_PATH = path.resolve(__dirname, "../../api/index.js");

function readConstantValue(source, constantName) {
  const re = new RegExp(
    `${constantName}\\s*=\\s*([0-9_]+)`,
  );
  const match = source.match(re);
  if (!match) {
    throw new Error(`Could not find constant ${constantName} in chatService.js`);
  }
  return Number(match[1].replace(/_/g, ""));
}

function readMaxDuration(source) {
  // Matches `maxDuration: 300` inside the exported config object.
  const re = /maxDuration\s*:\s*(\d+)/;
  const match = source.match(re);
  if (!match) {
    throw new Error("Could not find maxDuration in api/index.js");
  }
  return Number(match[1]);
}

describe("chat service streaming timeouts", () => {
  const source = fs.readFileSync(CHAT_SERVICE_PATH, "utf8");
  const totalTimeout = readConstantValue(source, "XAI_STREAM_TOTAL_TIMEOUT_MS");
  const idleTimeout = readConstantValue(source, "XAI_STREAM_IDLE_TIMEOUT_MS");

  it("total stream timeout is at the Vercel Pro budget (≥ 290s)", () => {
    expect(totalTimeout).toBeGreaterThanOrEqual(290_000);
  });

  it("total stream timeout is below the Vercel function ceiling (≤ 300s) so cleanup can run", () => {
    expect(totalTimeout).toBeLessThanOrEqual(300_000);
  });

  it("idle timeout allows for at least 60s of silence between chunks", () => {
    expect(idleTimeout).toBeGreaterThanOrEqual(60_000);
  });

  it("idle timeout is strictly less than the total timeout", () => {
    expect(idleTimeout).toBeLessThan(totalTimeout);
  });

  it("api/index.js exports config.maxDuration: 300 (Vercel Pro ceiling)", () => {
    const apiSource = fs.readFileSync(API_ENTRY_PATH, "utf8");
    expect(readMaxDuration(apiSource)).toBe(300);
  });
});
