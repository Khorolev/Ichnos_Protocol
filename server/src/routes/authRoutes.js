/**
 * Auth Routes
 *
 * Maps HTTP endpoints to auth controller handlers
 * with appropriate middleware chains.
 */
import { Router } from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import { validateRequest } from "../middleware/validation.js";
import {
  syncProfileSchema,
  updateProfileSchema,
  adminClaimSchema,
} from "../validators/authSchemas.js";
import * as authController from "../controllers/authController.js";

const router = Router();

router.post(
  "/sync-profile",
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

router.post(
  "/admin/claim",
  auth,
  admin,
  validateRequest(adminClaimSchema),
  authController.setAdminClaim,
);

export default router;
