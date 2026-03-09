/**
 * Admin Routes
 *
 * Maps HTTP endpoints to admin controller handlers
 * with auth + admin middleware chains.
 */
import { Router } from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import cronOrAdmin from "../middleware/cronAuth.js";
import { validateRequest } from "../middleware/validation.js";
import {
  adminUpdateRequestSchema,
  adminManageAdminsSchema,
} from "../validators/adminSchemas.js";
import * as adminController from "../controllers/adminController.js";

const router = Router();

router.get("/users", auth, admin, adminController.getUsers);
router.get("/requests/:userId", auth, admin, adminController.getRequestsByUser);
router.get("/chat-leads", auth, admin, adminController.getChatLeads);
router.get("/chat-leads/:userId", auth, admin, adminController.getChatLeadDetail);

router.put(
  "/request/:id",
  auth,
  admin,
  validateRequest(adminUpdateRequestSchema, { statusCode: 422 }),
  adminController.updateRequest,
);

router.delete("/request/:id", auth, admin, adminController.deleteRequest);

router.post("/analyze-topics", auth, admin, adminController.analyzeTopics);
router.get("/topics", auth, admin, adminController.getTopics);
router.get("/export", auth, admin, adminController.exportCSV);
router.post(
  "/manage-admins",
  auth,
  admin,
  validateRequest(adminManageAdminsSchema, { statusCode: 422 }),
  adminController.manageAdmins,
);

router.post("/retention-sweep", cronOrAdmin, adminController.runRetentionSweep);
router.get("/retention-sweep", cronOrAdmin, adminController.runRetentionSweep);
router.post("/notifications/digest", cronOrAdmin, adminController.sendDailyDigest);
router.get("/notifications/digest", cronOrAdmin, adminController.sendDailyDigest);

export default router;
