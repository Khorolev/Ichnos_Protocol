/**
 * Question Repository
 *
 * Data access functions for questions and question_topics tables.
 * All queries are parameterized to prevent SQL injection.
 */
import pool from "../config/database.js";

export async function createQuestion(userId, questionData) {
  try {
    const { question, answer, source, contactRequestId } = questionData;
    const { rows } = await pool.query(
      `INSERT INTO questions (user_id, question, answer, source, contact_request_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, question, answer || null, source, contactRequestId || null],
    );
    return rows[0];
  } catch (error) {
    console.error("questionRepository.createQuestion failed:", error.message);
    throw error;
  }
}

export async function getQuestionsByUserId(userId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM questions WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return rows;
  } catch (error) {
    console.error("questionRepository.getQuestionsByUserId failed:", error.message);
    throw error;
  }
}

export async function getChatHistoryByUserId(userId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM questions
       WHERE user_id = $1 AND source = 'chat'
       ORDER BY created_at ASC`,
      [userId],
    );
    return rows;
  } catch (error) {
    console.error("questionRepository.getChatHistoryByUserId failed:", error.message);
    throw error;
  }
}

export async function getDailyChatCount(userId, date) {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM questions
       WHERE user_id = $1 AND source = 'chat' AND created_at >= $2`,
      [userId, date],
    );
    return rows[0].count;
  } catch (error) {
    console.error("questionRepository.getDailyChatCount failed:", error.message);
    throw error;
  }
}

export async function createTopic(questionId, topicData) {
  try {
    const { topic, confidence, model } = topicData;
    const { rows } = await pool.query(
      `INSERT INTO question_topics (question_id, topic, confidence, model)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [questionId, topic, confidence || null, model || null],
    );
    return rows[0];
  } catch (error) {
    console.error("questionRepository.createTopic failed:", error.message);
    throw error;
  }
}

export async function getTopicsByQuestionId(questionId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM question_topics WHERE question_id = $1`,
      [questionId],
    );
    return rows;
  } catch (error) {
    console.error("questionRepository.getTopicsByQuestionId failed:", error.message);
    throw error;
  }
}

const PII_PATTERNS = [
  { regex: /[\w.-]+@[\w.-]+\.\w{2,}/g, replacement: "[REDACTED_EMAIL]" },
  { regex: /\+?\d[\d\s\-().]{7,}\d/g, replacement: "[REDACTED_PHONE]" },
  { regex: /https?:\/\/\S+/g, replacement: "[REDACTED_URL]" },
];

function redactPII(text) {
  if (!text) return text;
  let redacted = text;
  for (const { regex, replacement } of PII_PATTERNS) {
    redacted = redacted.replace(regex, replacement);
  }
  return redacted;
}

export async function scrubQuestionTexts(
  questionId,
  scrubbedQuestion,
  scrubbedAnswer,
) {
  try {
    const { rows } = await pool.query(
      `UPDATE questions SET question = $2, answer = $3 WHERE id = $1 RETURNING *`,
      [questionId, scrubbedQuestion, scrubbedAnswer],
    );
    return rows[0];
  } catch (error) {
    console.error(
      "questionRepository.scrubQuestionTexts failed:",
      error.message,
    );
    throw error;
  }
}

export async function scrubQuestionPII(questionId) {
  try {
    const { rows: existing } = await pool.query(
      `SELECT question, answer FROM questions WHERE id = $1`,
      [questionId],
    );

    if (!existing[0]) return null;

    const redactedQuestion = redactPII(existing[0].question);
    const redactedAnswer = redactPII(existing[0].answer);

    const { rows } = await pool.query(
      `UPDATE questions SET question = $2, answer = $3 WHERE id = $1 RETURNING *`,
      [questionId, redactedQuestion, redactedAnswer],
    );
    return rows[0];
  } catch (error) {
    console.error("questionRepository.scrubQuestionPII failed:", error.message);
    throw error;
  }
}
