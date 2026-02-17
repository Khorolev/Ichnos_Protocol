/**
 * Shared metadata generation helper using xAI Grok API.
 *
 * Generates title, category, and tags from a text snippet.
 * Used by extractPdfKnowledgeLegacy.js, extractMarkdownKnowledge.js, and extractWebKnowledge.js.
 *
 * @module metadataGenerator
 */

const XAI_TIMEOUT_MS = 15000;

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

/**
 * Generate metadata (title, category, tags) for a content chunk.
 *
 * @param {string} content - Text content to analyze (first 1500 chars sent)
 * @returns {Promise<{title: string, category: string, tags: string[]}>}
 */
async function generateMetadata(content) {
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
      throw new Error(`xAI API returned ${response.status}`);
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

export { generateMetadata, VALID_CATEGORIES, XAI_TIMEOUT_MS };
