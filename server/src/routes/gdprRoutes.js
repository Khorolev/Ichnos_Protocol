/**
 * GDPR Routes
 *
 * Maps HTTP endpoints to GDPR controller handlers
 * with appropriate middleware chains.
 */
import { Router } from "express";
import auth from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import { deleteAccountSchema } from "../validators/gdprSchemas.js";
import * as gdprController from "../controllers/gdprController.js";

const router = Router();

router.get("/download", auth, gdprController.downloadData);

router.post(
  "/delete",
  auth,
  validateRequest(deleteAccountSchema),
  gdprController.deleteAccount,
);

export default router;
