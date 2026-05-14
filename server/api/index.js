/**
 * Vercel Serverless Entry Point
 *
 * Wraps the Express app as a Vercel serverless function.
 * In local development, use `npm run dev` instead (starts Express on PORT).
 * This file is only used by Vercel's build system.
 */
import app from "../src/app.js";

/**
 * Vercel function configuration.
 *
 * `maxDuration: 300` raises the function execution ceiling to the Vercel Pro
 * maximum (5 minutes), sized to accommodate streaming RAG responses from
 * the chat endpoint. Declared here — not in vercel.json — because the
 * project uses the legacy `builds` configuration and Vercel rejects a
 * `functions` block alongside `builds` with the "Conflicting Functions and
 * Builds Configuration" error. Per-function config exported from the entry
 * file is the supported pattern in legacy-builds mode.
 *
 * Coupled with the streaming timeouts in src/services/chatService.js:
 *   - XAI_STREAM_TOTAL_TIMEOUT_MS = 290_000 (just under this ceiling)
 *   - XAI_STREAM_IDLE_TIMEOUT_MS  =  60_000
 */
export const config = {
  maxDuration: 300,
};

export default app;
