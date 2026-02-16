/**
 * Zod Validation Middleware Factory
 *
 * Returns Express middleware that validates req.body against
 * the provided Zod schema. Returns 400 with structured errors
 * on validation failure.
 */
export function validateRequest(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      return res.status(400).json({
        data: null,
        error: errors,
        message: "Validation failed",
      });
    }

    req.body = result.data;
    next();
  };
}
