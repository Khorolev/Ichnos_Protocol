/**
 * Auth Routes
 *
 * Maps HTTP endpoints to auth controller handlers
 * with appropriate middleware chains.
 */
import { Router } from "express";
import auth from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import {
  syncProfileSchema,
  updateProfileSchema,
} from "../validators/authSchemas.js";
import * as authController from "../controllers/authController.js";

const router = Router();

router.post(
  "/sync-profile",
  auth,
  validateRequest(syncProfileSchema),
  authController.syncProfile,
);

router.post("/verify-token", authController.verifyToken);

router.get("/me", auth, authController.getMe);

router.put(
  "/profile",
  auth,
  validateRequest(updateProfileSchema),
  authController.updateProfile,
);

export default router;
