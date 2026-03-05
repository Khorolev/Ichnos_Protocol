/**
 * Chat Helpers
 *
 * Pure utility functions for chat service operations.
 */
const MAX_CONTEXT_WORDS = 1000;

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
