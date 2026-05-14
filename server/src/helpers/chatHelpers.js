/**
 * Chat Helpers
 *
 * Pure utility functions for chat service operations.
 */
const MAX_CONTEXT_WORDS = 1000;
const MAX_TOPIC_INPUT_LENGTH = 500;

export const SYSTEM_PROMPT = `You are Ichnos Protocol's AI assistant. You help visitors learn about the Ichnos Battery Passport platform, EU battery regulations, compliance requirements, and our services. Be concise, professional, and helpful. If you don't know something, say so honestly. When relevant, suggest contacting the team for detailed pricing or custom requirements.`;

/**
 * Create an Error with an attached HTTP status code.
 *
 * @param {string} message - Human-readable error description
 * @param {number} statusCode - HTTP status code to attach to the error
 * @returns {Error} Error instance with a `statusCode` property
 */
export function buildError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/**
 * Build a trimmed context string from an array of knowledge-base documents.
 * Documents are concatenated up to MAX_CONTEXT_WORDS total words; any document
 * that would exceed the limit is skipped.
 *
 * @param {{content: string}[]} documents - Array of document objects with a `content` field
 * @returns {string} Formatted context string, or an empty string when no valid documents exist
 */
export function buildContextString(documents) {
  if (!documents || documents.length === 0) return "";

  let wordCount = 0;
  const parts = [];

  for (const doc of documents) {
    if (!doc.content || typeof doc.content !== "string" || !doc.content.trim())
      continue;
    const words = doc.content.split(/\s+/);
    if (wordCount + words.length > MAX_CONTEXT_WORDS) continue;
    parts.push(doc.content);
    wordCount += words.length;
  }

  if (parts.length === 0) return "";

  return `Relevant information:\n\n${parts.join("\n\n")}`;
}

/**
 * Combine an optional RAG context block with the user's question into a
 * single content string for the AI `user` message.
 *
 * @param {string} context - Pre-built context string (may be empty)
 * @param {string} message - The raw user message
 * @returns {string} Combined content ready to be sent as the user role message
 */
export function buildUserContent(context, message) {
  return context ? `${context}\n\nQuestion: ${message}` : `Question: ${message}`;
}

/**
 * Assemble the request body payload for the xAI API chat completion call.
 *
 * @param {{role: string, content: string}[]} messages - Ordered list of chat messages
 * @param {string} model - xAI model identifier (e.g. "grok-3-mini")
 * @param {number} temperature - Sampling temperature (0–2)
 * @returns {{model: string, messages: {role: string, content: string}[], temperature: number}} xAI API request body
 */
export function buildXaiPayload(messages, model, temperature, { stream = false } = {}) {
  const payload = { model, messages, temperature };
  if (stream) payload.stream = true;
  return payload;
}

/**
 * Build the HTTP headers required by the xAI API.
 * Reads `XAI_API_KEY` from the environment and throws a 503 error if absent.
 *
 * @returns {{Authorization: string, "Content-Type": string}} Headers object for xAI API requests
 * @throws {Error} When XAI_API_KEY is not set (statusCode 503)
 */
export function buildXaiHeaders() {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw buildError(
      "XAI_API_KEY environment variable is not set. Please configure your xAI API key.",
      503
    );
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

/**
 * Strip control characters from user input to prevent prompt injection.
 * Preserves normal whitespace (spaces, newlines, tabs).
 *
 * @param {string} text - Raw user input
 * @returns {string} Sanitized text
 */
export function sanitizeUserInput(text) {
  const str = text == null ? "" : String(text);
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Build the messages array used to ask the AI to extract topic keywords from
 * a user message. The system prompt instructs the model to return only
 * comma-separated keywords. User input is sanitized and truncated to prevent
 * prompt injection.
 *
 * @param {string} message - The user message to extract keywords from
 * @returns {{role: string, content: string}[]} Messages array for the topic-extraction AI call
 */
export function buildTopicMessages(message) {
  const systemContent = `${SYSTEM_PROMPT}\n\nYour task now is: Extract 1-3 topic keywords from the user's question (respond with comma-separated keywords only).`;
  const sanitized = sanitizeUserInput(message).slice(0, MAX_TOPIC_INPUT_LENGTH);

  return [
    {
      role: "system",
      content: systemContent,
    },
    {
      role: "user",
      content: sanitized,
    },
  ];
}

/**
 * Parse a comma-separated keyword string returned by the AI into a clean array.
 * Each keyword is trimmed, lowercased, and length-filtered (1–49 characters).
 * At most 3 keywords are returned.
 *
 * @param {string} rawText - Raw comma-separated text from the AI response
 * @returns {string[]} Array of up to 3 cleaned keyword strings
 */
export function parseTopicKeywords(rawText) {
  return rawText
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0 && t.length < 50)
    .slice(0, 3);
}
