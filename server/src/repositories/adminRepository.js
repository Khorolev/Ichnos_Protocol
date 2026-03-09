/**
 * Admin Repository
 *
 * Data access functions for admin dashboard queries.
 * All queries are parameterized to prevent SQL injection.
 */
import pool from "../config/database.js";

export async function getUsersWithRequests() {
  try {
    const { rows } = await pool.query(
      `SELECT u.firebase_uid AS "userId",
              p.name, p.surname, p.email, p.phone, p.company,
              COUNT(cr.id)::int AS "totalRequests",
              MAX(cr.updated_at) AS "lastActivity"
       FROM users u
       JOIN user_profiles p ON u.firebase_uid = p.user_id
       JOIN contact_requests cr ON cr.user_id = u.firebase_uid
       WHERE u.deleted_at IS NULL
       GROUP BY u.firebase_uid, p.name, p.surname, p.email, p.phone, p.company
       ORDER BY "lastActivity" DESC`,
    );
    return rows;
  } catch (error) {
    console.error("adminRepository.getUsersWithRequests failed:", error.message);
    throw error;
  }
}

export async function getRequestsWithQuestionsByUserId(userId) {
  try {
    const { rows } = await pool.query(
      `SELECT cr.* FROM contact_requests cr
       WHERE cr.user_id = $1
       ORDER BY cr.created_at DESC`,
      [userId],
    );
    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);
    const { rows: qRows } = await pool.query(
      `SELECT id, question, answer, source, created_at, contact_request_id
       FROM questions WHERE contact_request_id = ANY($1)
       ORDER BY created_at ASC`,
      [ids],
    );

    const questionsMap = new Map();
    for (const q of qRows) {
      const list = questionsMap.get(q.contact_request_id) || [];
      list.push(q);
      questionsMap.set(q.contact_request_id, list);
    }

    return rows.map((r) => ({
      ...r,
      questionPreview: questionsMap.get(r.id)?.[0]?.question ?? "",
      questions: questionsMap.get(r.id) ?? [],
    }));
  } catch (error) {
    console.error(
      "adminRepository.getRequestsWithQuestionsByUserId failed:",
      error.message,
    );
    throw error;
  }
}

export async function getChatOnlyUsers() {
  try {
    const { rows } = await pool.query(
      `SELECT u.firebase_uid AS "userId",
              p.name, p.surname, p.email, p.phone, p.company,
              COUNT(q.id)::int AS "totalMessages",
              MAX(q.created_at) AS "lastActivity"
       FROM users u
       JOIN user_profiles p ON u.firebase_uid = p.user_id
       JOIN questions q ON q.user_id = u.firebase_uid AND q.source = 'chat'
       WHERE u.deleted_at IS NULL
         AND u.firebase_uid NOT IN (
           SELECT DISTINCT user_id FROM contact_requests
         )
       GROUP BY u.firebase_uid, p.name, p.surname, p.email, p.phone, p.company
       ORDER BY "lastActivity" DESC`,
    );
    return rows;
  } catch (error) {
    console.error("adminRepository.getChatOnlyUsers failed:", error.message);
    throw error;
  }
}

export async function getChatMessagesByUserId(userId) {
  try {
    const { rows } = await pool.query(
      `SELECT id, question, answer, created_at
       FROM questions
       WHERE user_id = $1 AND source = 'chat'
       ORDER BY created_at ASC`,
      [userId],
    );
    return rows;
  } catch (error) {
    console.error(
      "adminRepository.getChatMessagesByUserId failed:",
      error.message,
    );
    throw error;
  }
}
