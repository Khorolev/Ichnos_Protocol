/**
 * Chat Service
 *
 * Business logic for chat operations including xAI Grok integration,
 * RAG context retrieval, rate limiting, and topic classification.
 */
import * as questionRepository from "../repositories/questionRepository.js";
import * as knowledgeRepository from "../repositories/knowledgeRepository.js";
import * as userRepository from "../repositories/userRepository.js";

const DAILY_LIMIT = 3;
const XAI_TIMEOUT_MS = 8000;
const TOPIC_TIMEOUT_MS = 2000;
const MAX_CONTEXT_WORDS = 1000;

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "shall",
  "can",
  "to",
  "of",
  "in",
  "for",
  "on",
  "with",
  "at",
  "by",
  "from",
  "as",
  "into",
  "through",
  "during",
  "before",
  "after",
  "and",
  "but",
  "or",
  "nor",
  "not",
  "so",
  "yet",
  "both",
  "either",
  "neither",
  "each",
  "every",
  "all",
  "any",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "only",
  "own",
  "same",
  "than",
  "too",
  "very",
  "just",
  "about",
  "above",
  "below",
  "between",
  "up",
  "down",
  "out",
  "off",
  "over",
  "under",
  "again",
  "further",
  "then",
  "once",
  "here",
  "there",
  "when",
  "where",
  "why",
  "how",
  "what",
  "which",
  "who",
  "whom",
  "this",
  "that",
  "these",
  "those",
  "i",
  "me",
  "my",
  "myself",
  "we",
  "our",
  "you",
  "your",
  "he",
  "him",
  "his",
  "she",
  "her",
  "it",
  "its",
  "they",
  "them",
  "their",
]);

const SYSTEM_PROMPT = `You are Ichnos Protocol's AI assistant. You help visitors learn about the Ichnos Battery Passport platform, EU battery regulations, compliance requirements, and our services. Be concise, professional, and helpful. If you don't know something, say so honestly. When relevant, suggest contacting the team for detailed pricing or custom requirements.`;

function buildError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function extractKeywords(text) {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

  const unique = [...new Set(tokens)];
  return unique.slice(0, 10);
}

function buildContextString(documents) {
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

export async function callXaiApi(messages, timeoutMs) {
  const endpoint =
    process.env.XAI_API_ENDPOINT || "https://api.x.ai/v1/chat/completions";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-3-mini",
        messages,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const status = response.status >= 500 ? 503 : 500;
      throw buildError("xAI API request failed", status);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    if (error.name === "AbortError") {
      throw buildError("xAI API request timed out", 503);
    }
    if (error.statusCode) throw error;
    throw buildError("xAI API unavailable", 503);
  } finally {
    clearTimeout(timer);
  }
}

async function classifyTopics(questionId, message) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TOPIC_TIMEOUT_MS);

  try {
    const endpoint =
      process.env.XAI_API_ENDPOINT || "https://api.x.ai/v1/chat/completions";

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
            content: `Extract 1-3 topic keywords from this question (respond with comma-separated keywords only): ${message}`,
          },
        ],
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    if (!response.ok) return;

    const data = await response.json();
    const raw = data.choices[0].message.content;
    const topics = raw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0 && t.length < 50);

    for (const topic of topics.slice(0, 3)) {
      await questionRepository.createTopic(questionId, {
        topic,
        confidence: null,
        model: "grok-3-mini",
      });
    }
  } catch (error) {
    console.warn("Topic classification failed (non-blocking):", error.message);
  } finally {
    clearTimeout(timer);
  }
}

export async function sendMessage(userId, message) {
  const today = new Date().toISOString().split("T")[0];
  const dailyCount = await questionRepository.getDailyChatCount(userId, today);

  if (dailyCount >= DAILY_LIMIT) {
    throw buildError("Daily message limit reached (3/day)", 429);
  }

  const keywords = extractKeywords(message);
  const documents = await knowledgeRepository.queryKnowledgeBase(
    keywords,
    null,
  );
  const context = buildContextString(documents);

  const userContent = context
    ? `${context}\n\nQuestion: ${message}`
    : `Question: ${message}`;

  const answer = await callXaiApi(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    XAI_TIMEOUT_MS,
  );

  const question = await questionRepository.createQuestion(userId, {
    question: message,
    answer,
    source: "chat",
    contactRequestId: null,
  });

  await userRepository.updateUserActivity(userId);

  await classifyTopics(question.id, message);

  return { answer, messageId: question.id, dailyCount: dailyCount + 1 };
}

export async function getChatHistory(userId) {
  const rows = await questionRepository.getChatHistoryByUserId(userId);

  return rows.map(({ id, question, answer, created_at }) => ({
    id,
    question,
    answer,
    created_at,
  }));
}
