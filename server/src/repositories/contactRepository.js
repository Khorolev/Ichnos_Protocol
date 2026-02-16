/**
 * Contact Repository
 *
 * Data access functions for the contact_requests table.
 * All queries are parameterized to prevent SQL injection.
 */
import pool from "../config/database.js";

export async function createContactRequest(userId, consentData) {
  try {
    const { consentTimestamp, consentVersion } = consentData;
    const { rows } = await pool.query(
      `INSERT INTO contact_requests (user_id, contact_consent_timestamp, contact_consent_version)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, consentTimestamp, consentVersion],
    );
    return rows[0];
  } catch (error) {
    console.error("contactRepository.createContactRequest failed:", error.message);
    throw error;
  }
}

export async function getRequestsByUserId(userId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM contact_requests WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return rows;
  } catch (error) {
    console.error("contactRepository.getRequestsByUserId failed:", error.message);
    throw error;
  }
}

export async function getRequestById(requestId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM contact_requests WHERE id = $1`,
      [requestId],
    );
    return rows[0] || null;
  } catch (error) {
    console.error("contactRepository.getRequestById failed:", error.message);
    throw error;
  }
}

export async function updateRequest(requestId, updates) {
  try {
    const { status, adminNotes } = updates;
    const { rows } = await pool.query(
      `UPDATE contact_requests
       SET status = COALESCE($2, status),
           admin_notes = COALESCE($3, admin_notes)
       WHERE id = $1
       RETURNING *`,
      [requestId, status || null, adminNotes || null],
    );
    return rows[0] || null;
  } catch (error) {
    console.error("contactRepository.updateRequest failed:", error.message);
    throw error;
  }
}

export async function deleteRequest(requestId) {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM contact_requests WHERE id = $1`,
      [requestId],
    );
    return rowCount > 0;
  } catch (error) {
    console.error("contactRepository.deleteRequest failed:", error.message);
    throw error;
  }
}

export async function getAllRequestsWithUserInfo() {
  try {
    const { rows } = await pool.query(
      `SELECT cr.*, p.name, p.surname, p.email, p.phone, p.company
       FROM contact_requests cr
       JOIN users u ON cr.user_id = u.firebase_uid
       LEFT JOIN user_profiles p ON u.firebase_uid = p.user_id
       ORDER BY cr.created_at DESC`,
    );
    return rows;
  } catch (error) {
    console.error("contactRepository.getAllRequestsWithUserInfo failed:", error.message);
    throw error;
  }
}
