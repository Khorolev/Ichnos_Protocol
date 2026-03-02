/**
 * Shared metadata generation helper using xAI Grok API.
 *
 * Generates title, category, and tags from a text snippet.
 * Includes retry with exponential backoff for transient failures.
 *
 * @module metadataGenerator
 */

const XAI_TIMEOUT_MS = 30000;
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;
const MAX_DELAY_MS = 60000;

const VALID_CATEGORIES = [
  "battery_passport",
  "batteries",
  "homologation",
  "services",
  "regulations",
  "standards",
  "supply_chain",
  "general",
];

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

function isRetryable(error) {
  if (error.name === "AbortError") return true;
  if (error.cause?.code === "ECONNRESET") return true;
  if (error.cause?.code === "ETIMEDOUT") return true;
  if (error.cause?.code === "UND_ERR_CONNECT_TIMEOUT") return true;
  if (error.message?.includes("fetch failed")) return true;
  if (error.statusCode && RETRYABLE_STATUS_CODES.has(error.statusCode)) {
    return true;
  }
  return false;
}

function computeDelay(attempt) {
  const jitter = Math.random() * 1000;
  const delay = Math.min(BASE_DELAY_MS * 2 ** attempt + jitter, MAX_DELAY_MS);
  return Math.round(delay);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callXaiApi(content) {
  const endpoint =
    process.env.XAI_API_ENDPOINT ||
    "https://api.x.ai/v1/chat/completions";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), XAI_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-3-mini",
        messages: [
          {
            role: "user",
            content: `Analyze this text and return ONLY valid JSON (no markdown):
{
  "title": "concise title, max 10 words",
  "category": "one of: battery_passport, batteries, homologation, services, regulations, standards, supply_chain, general",
  "tags": ["3-5", "lowercase", "keyword", "tags"]
}

Text: ${content.slice(0, 1500)}`,
          },
        ],
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = new Error(`xAI API returned ${response.status}`);
      err.statusCode = response.status;
      throw err;
    }

    const data = await response.json();
    const raw = data.choices[0].message.content.trim();
    const jsonStr = raw.replace(/```json?\s*/g, "").replace(/```/g, "");
    const parsed = JSON.parse(jsonStr);

    return {
      title: String(parsed.title || "Untitled").slice(0, 100),
      category: VALID_CATEGORIES.includes(parsed.category)
        ? parsed.category
        : "general",
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.slice(0, 5).map((t) => String(t).toLowerCase())
        : [],
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Generate metadata (title, category, tags) for a content chunk.
 * Retries up to MAX_RETRIES times with exponential backoff on transient errors.
 *
 * @param {string} content - Text content to analyze (first 1500 chars sent)
 * @returns {Promise<{title: string, category: string, tags: string[]}>}
 */
async function generateMetadata(content) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callXaiApi(content);
    } catch (error) {
      lastError = error;

      if (attempt < MAX_RETRIES && isRetryable(error)) {
        const delay = computeDelay(attempt);
        console.warn(
          `    [retry ${attempt + 1}/${MAX_RETRIES}] ${error.message} — waiting ${delay}ms`,
        );
        await sleep(delay);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

export { generateMetadata, VALID_CATEGORIES, XAI_TIMEOUT_MS };
