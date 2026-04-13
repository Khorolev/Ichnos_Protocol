import * as questionRepository from "../repositories/questionRepository.js";
import * as knowledgeRepository from "../repositories/knowledgeRepository.js";
import * as userRepository from "../repositories/userRepository.js";
import { STOP_WORDS } from "../helpers/stopWords.js";
import {
  buildError,
  buildContextString,
  buildUserContent,
  buildXaiPayload,
  buildXaiHeaders,
  buildTopicMessages,
  parseTopicKeywords,
  SYSTEM_PROMPT,
} from "../helpers/chatHelpers.js";

const DAILY_LIMIT = 3;
const XAI_TIMEOUT_MS = 8000;
const TOPIC_TIMEOUT_MS = 2000;

export function extractKeywords(text) {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

  const unique = [...new Set(tokens)];
  return unique.slice(0, 10);
}

export async function callXaiApi(messages, timeoutMs, { model = "grok-3-mini", temperature = 0.7 } = {}) {
  const endpoint = process.env.XAI_API_ENDPOINT || "https://api.x.ai/v1/chat/completions";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: buildXaiHeaders(),
      body: JSON.stringify(buildXaiPayload(messages, model, temperature)),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`[xAI] HTTP ${response.status}: ${body.slice(0, 300)}`);
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
  try {
    const raw = await callXaiApi(buildTopicMessages(message), TOPIC_TIMEOUT_MS, { temperature: 0.3 });
    const topics = parseTopicKeywords(raw);

    for (const topic of topics) {
      await questionRepository.createTopic(questionId, {
        topic,
        confidence: null,
        model: "grok-3-mini",
      });
    }
  } catch (error) {
    console.warn("Topic classification failed (non-blocking):", error.message);
  }
}

export async function sendMessage(userId, message) {
  const today = new Date().toISOString().split("T")[0];
  const dailyCount = await questionRepository.getDailyChatCount(userId, today);

  if (dailyCount >= DAILY_LIMIT) {
    throw buildError("Daily message limit reached (3/day)", 429);
  }

  const keywords = extractKeywords(message);
  const documents = await knowledgeRepository.queryKnowledgeBase(keywords, null);
  const userContent = buildUserContent(buildContextString(documents), message);

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
    id, question, answer, created_at,
  }));
}
