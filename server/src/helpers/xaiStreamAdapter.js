/**
 * xAI Stream Adapter
 *
 * Isolated streaming adapter that converts xAI's OpenAI-compatible
 * streaming format into an async iterable of { delta } objects.
 * Does not touch callXaiApi — this is a parallel path for streaming.
 */
import {
  buildXaiHeaders,
  buildXaiPayload,
  buildError,
} from "./chatHelpers.js";

export async function* createXaiStream(
  messages,
  timeoutMs,
  { model = "grok-3-mini", temperature = 0.7, signal: externalSignal } = {},
) {
  const endpoint =
    process.env.XAI_API_ENDPOINT ||
    "https://api.x.ai/v1/chat/completions";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
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
      if (externalSignal?.aborted) {
        throw buildError("Stream aborted by caller", 499);
      }
      throw buildError("xAI API request timed out", 503);
    }
    if (error.statusCode) throw error;
    throw buildError("xAI API unavailable", 503);
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", onExternalAbort);
    }
  }
}
