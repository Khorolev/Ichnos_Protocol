/**
 * Admin Authorization Middleware
 *
 * Checks that the authenticated user has the admin custom claim.
 * Must run after the auth middleware which attaches req.user.
 * Firebase verifyIdToken returns custom claims as top-level properties.
 */
export default function admin(req, res, next) {
  const isAdmin = req.user?.admin === true;

  if (!isAdmin) {
    return res.status(403).json({
      data: null,
      error: "Forbidden: Admin access required",
      message: "You do not have permission to access this resource",
    });
  }

  next();
}
