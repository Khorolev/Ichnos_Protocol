/**
 * xAI Stream Adapter
 *
 * Isolated streaming adapter that converts xAI's OpenAI-compatible
 * streaming format into an async iterable of { delta } objects.
 *
 * Timeouts are dual-layer:
 *   - totalTimeoutMs (hard ceiling on full lifecycle, request → last token).
 *     Used to size the worst-case stream just under the Vercel function
 *     maxDuration so the server can clean up before Vercel kills it.
 *   - idleTimeoutMs (max silence between consecutive token chunks).
 *     Resets on every chunk received. Catches stalled upstreams quickly
 *     while letting long but healthy streams ride out under the total cap.
 *
 * Does not touch callXaiApi — this is a parallel path for streaming.
 */
import {
  buildXaiHeaders,
  buildXaiPayload,
  buildError,
} from "./chatHelpers.js";

const DEFAULT_IDLE_TIMEOUT_MS = 60_000;

export async function* createXaiStream(
  messages,
  totalTimeoutMs,
  {
    model = "grok-3-mini",
    temperature = 0.7,
    signal: externalSignal,
    idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
  } = {},
) {
  const endpoint =
    process.env.XAI_API_ENDPOINT ||
    "https://api.x.ai/v1/chat/completions";
  const controller = new AbortController();

  // Reason captures which timer triggered the abort, so the catch block
  // can surface a meaningful error to upstream code.
  let abortReason = null;

  const onTotalTimeout = () => {
    abortReason = "total_timeout";
    controller.abort();
  };
  const onIdleTimeout = () => {
    abortReason = "idle_timeout";
    controller.abort();
  };

  const totalTimer = setTimeout(onTotalTimeout, totalTimeoutMs);
  let idleTimer = setTimeout(onIdleTimeout, idleTimeoutMs);
  const bumpIdleTimer = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(onIdleTimeout, idleTimeoutMs);
  };

  const onExternalAbort = () => {
    abortReason = "external_abort";
    controller.abort();
  };
  if (externalSignal) {
    if (externalSignal.aborted) onExternalAbort();
    else externalSignal.addEventListener("abort", onExternalAbort);
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: buildXaiHeaders(),
      body: JSON.stringify(
        buildXaiPayload(messages, model, temperature, { stream: true }),
      ),
      signal: controller.signal,
    });

    if (!response.ok) {
      const status = response.status >= 500 ? 503 : 500;
      throw buildError("xAI API request failed", status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Healthy chunk arrived — reset the idle timer.
      bumpIdleTimer();

      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop();

      for (const frame of frames) {
        const dataLine = frame
          .split("\n")
          .find((line) => line.startsWith("data:"));
        if (!dataLine) continue;

        const raw = dataLine.slice(5).trim();
        if (raw === "[DONE]") return;

        const parsed = JSON.parse(raw);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) yield { delta: content };
      }
    }
  } catch (error) {
    if (error.name === "AbortError") {
      if (abortReason === "external_abort") {
        throw buildError("Stream aborted by caller", 499);
      }
      if (abortReason === "idle_timeout") {
        throw buildError("xAI stream stalled (no data received within idle window)", 503);
      }
      // total_timeout or unknown
      throw buildError("xAI stream exceeded total time budget", 503);
    }
    if (error.statusCode) throw error;
    throw buildError("xAI API unavailable", 503);
  } finally {
    clearTimeout(totalTimer);
    clearTimeout(idleTimer);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", onExternalAbort);
    }
  }
}
