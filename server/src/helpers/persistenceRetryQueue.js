/**
 * Persistence Retry Queue
 *
 * Retries an async function with bounded exponential backoff.
 * Fire-and-forget — does not block the caller.
 */

const MAX_RETRY_ATTEMPTS = 3;
const BASE_DELAY_MS = 1000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeWithRetry(retryFn, context, attempt) {
  console.info("[PERSIST_RETRY_ATTEMPT]", {
    attempt,
    maxAttempts: MAX_RETRY_ATTEMPTS,
    ...context,
  });

  try {
    await retryFn();
    console.info("[PERSIST_RETRY_SUCCESS]", { attempt, ...context });
  } catch (err) {
    if (attempt < MAX_RETRY_ATTEMPTS) {
      const backoffMs = BASE_DELAY_MS * 2 ** (attempt - 1);
      console.warn("[PERSIST_RETRY_BACKOFF]", {
        attempt,
        nextAttemptIn: backoffMs,
        error: err.message,
        ...context,
      });
      await delay(backoffMs);
      return executeWithRetry(retryFn, context, attempt + 1);
    }

    console.error("[PERSIST_RETRY_EXHAUSTED]", {
      attempts: attempt,
      error: err.message,
      ...context,
    });
  }
}

/**
 * Enqueue a fire-and-forget retry for an async persistence function.
 * @param {() => Promise<void>} retryFn  - Async function to retry on failure.
 * @param {{ userId?: string, question?: string }} context - Labels for log correlation.
 */
export function enqueueRetry(retryFn, context) {
  console.warn("[PERSIST_RETRY_QUEUED]", { ...context });
  return executeWithRetry(retryFn, context, 1).catch(() => {});
}
