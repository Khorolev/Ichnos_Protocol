/**
 * User Repository
 *
 * Data access functions for users and user_profiles tables.
 * All queries are parameterized to prevent SQL injection.
 */
import pool from "../config/database.js";

export async function createUser(firebaseUid) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (firebase_uid) VALUES ($1) RETURNING *`,
      [firebaseUid],
    );
    return rows[0];
  } catch (error) {
    console.error("userRepository.createUser failed:", error.message);
    throw error;
  }
}

export async function upsertProfile(userId, profileData) {
  try {
    const { name, surname, email, phone, company, linkedin } = profileData;
    const { rows } = await pool.query(
      `INSERT INTO user_profiles (user_id, name, surname, email, phone, company, linkedin)
       VALUES ($1, COALESCE($2, ''), COALESCE($3, ''), $4, $5, $6, $7)
       ON CONFLICT (user_id)
       DO UPDATE SET
         name = COALESCE($2, user_profiles.name),
         surname = COALESCE($3, user_profiles.surname),
         email = $4, phone = $5, company = $6, linkedin = $7
       RETURNING *`,
      [userId, name ?? null, surname ?? null, email, phone || null, company || null, linkedin || null],
    );
    return rows[0];
  } catch (error) {
    console.error("userRepository.upsertProfile failed:", error.message);
    throw error;
  }
}

export async function getUserById(userId) {
  try {
    const { rows } = await pool.query(
      `SELECT u.firebase_uid, u.deleted_at, u.created_at, u.updated_at,
              p.name, p.surname, p.email, p.phone, p.company, p.linkedin
       FROM users u
       LEFT JOIN user_profiles p ON u.firebase_uid = p.user_id
       WHERE u.firebase_uid = $1`,
      [userId],
    );
    return rows[0] || null;
  } catch (error) {
    console.error("userRepository.getUserById failed:", error.message);
    throw error;
  }
}

export async function getUserByEmail(email) {
  try {
    const { rows } = await pool.query(
      `SELECT u.firebase_uid, u.deleted_at, u.created_at, u.updated_at,
              p.name, p.surname, p.email, p.phone, p.company, p.linkedin
       FROM user_profiles p
       JOIN users u ON p.user_id = u.firebase_uid
       WHERE p.email = $1`,
      [email],
    );
    return rows[0] || null;
  } catch (error) {
    console.error("userRepository.getUserByEmail failed:", error.message);
    throw error;
  }
}

export async function updateUserActivity(userId) {
  try {
    await pool.query(
      `UPDATE users SET updated_at = NOW() WHERE firebase_uid = $1`,
      [userId],
    );
  } catch (error) {
    console.error("userRepository.updateUserActivity failed:", error.message);
    throw error;
  }
}

export async function deleteUserData(userId) {
  try {
    await pool.query(
      `UPDATE user_profiles
       SET name = 'Deleted', surname = 'Deleted',
           email = 'deleted@deleted.invalid',
           phone = NULL, company = NULL, linkedin = NULL
       WHERE user_id = $1`,
      [userId],
    );
    await pool.query(
      `UPDATE users SET deleted_at = NOW() WHERE firebase_uid = $1`,
      [userId],
    );
  } catch (error) {
    console.error("userRepository.deleteUserData failed:", error.message);
    throw error;
  }
}
