/**
 * Super-Admin Authorization Middleware
 *
 * Checks that the authenticated user has the superAdmin custom claim.
 * Must run after the auth middleware which attaches req.user.
 * Firebase verifyIdToken returns custom claims as top-level properties.
 */
export default function superAdmin(req, res, next) {
  const isSuperAdmin = req.user?.superAdmin === true;

  if (!isSuperAdmin) {
    return res.status(403).json({
      data: null,
      error: "Forbidden: Super-admin access required",
      message: "You do not have permission to access this resource",
    });
  }

  next();
}
