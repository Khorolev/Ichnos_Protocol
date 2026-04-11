/**
 * Maps a raw user row from the repository layer into the canonical
 * camelCase shape exposed by the auth service boundary.
 *
 * This helper centralizes the DB → API contract for the `user` object.
 * Repository-only fields (`created_at`, `updated_at`, `deleted_at`,
 * `user_id`) are intentionally omitted, and `firebase_uid` is renamed
 * to `firebaseUid`. The `email` field is taken from `canonicalEmail`
 * (typically the Firebase-verified address) rather than the DB row,
 * so stale or null DB emails never leak into the API payload.
 *
 * @param {object} dbRow - raw repository row (snake_case keys)
 * @param {string|null|undefined} canonicalEmail - email to expose
 * @returns {object} canonical user shape (camelCase)
 */
export function mapUserRow(dbRow, canonicalEmail) {
  return {
    firebaseUid: dbRow.firebase_uid,
    email: canonicalEmail,
    name: dbRow.name,
    surname: dbRow.surname,
    phone: dbRow.phone,
    company: dbRow.company,
    linkedin: dbRow.linkedin,
  };
}
