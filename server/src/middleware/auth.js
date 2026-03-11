/**
 * Firebase Authentication Middleware
 *
 * Extracts and verifies the Firebase ID token from the Authorization
 * header. Attaches the decoded token to req.user on success.
 */
import firebaseAdmin from "../config/firebase.js";

function extractToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.split("Bearer ")[1];
}

export default async function auth(req, res, next) {
  const token = extractToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({
      data: null,
      error: "Missing or malformed authorization token",
      message: "Authentication required",
    });
  }

  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    const isExpired = error.code === "auth/id-token-expired";
    const isRevoked = error.code === "auth/id-token-revoked";

    const message = isExpired
      ? "Token has expired"
      : isRevoked
        ? "Token has been revoked"
        : "Invalid authentication token";

    return res.status(401).json({
      data: null,
      error: message,
      message: "Authentication failed",
    });
  }
}
