/**
 * Cron or Admin Authentication Middleware
 *
 * Accepts requests with a valid Authorization: Bearer CRON_SECRET,
 * or falls through to Firebase auth + admin middleware chain.
 * This allows cron-triggered endpoints to work without a Firebase
 * token while still permitting manual admin execution.
 */
import auth from "./auth.js";
import admin from "./admin.js";

export default function cronOrAdmin(req, res, next) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (cronSecret && token === cronSecret) {
    return next();
  }

  auth(req, res, (authErr) => {
    if (authErr) return next(authErr);
    admin(req, res, next);
  });
}
