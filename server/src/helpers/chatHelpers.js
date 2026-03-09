/**
 * Chat Helpers
 *
 * Pure utility functions for chat service operations.
 */
const MAX_CONTEXT_WORDS = 1000;

export const SYSTEM_PROMPT = `You are Ichnos Protocol's AI assistant. You help visitors learn about the Ichnos Battery Passport platform, EU battery regulations, compliance requirements, and our services. Be concise, professional, and helpful. If you don't know something, say so honestly. When relevant, suggest contacting the team for detailed pricing or custom requirements.`;

export function buildError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function buildContextString(documents) {
  if (!documents || documents.length === 0) return "";

  let wordCount = 0;
  const parts = [];

  for (const doc of documents) {
    if (!doc.content || typeof doc.content !== "string" || !doc.content.trim())
      continue;
    const words = doc.content.split(/\s+/);
    if (wordCount + words.length > MAX_CONTEXT_WORDS) break;
    parts.push(doc.content);
    wordCount += words.length;
  }

  if (parts.length === 0) return "";

  return `Relevant information:\n\n${parts.join("\n\n")}`;
}

export function buildUserContent(context, message) {
  return context ? `${context}\n\nQuestion: ${message}` : `Question: ${message}`;
}

export function buildXaiPayload(messages, model, temperature) {
  return { model, messages, temperature };
}

export function buildXaiHeaders() {
  return {
    Authorization: `Bearer ${process.env.XAI_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export function buildTopicMessages(message) {
  return [
    {
      role: "user",
      content: `Extract 1-3 topic keywords from this question (respond with comma-separated keywords only): ${message}`,
    },
  ];
}

export function parseTopicKeywords(rawText) {
  return rawText
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0 && t.length < 50)
    .slice(0, 3);
}
