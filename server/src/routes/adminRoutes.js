/**
 * Admin Routes
 *
 * Maps HTTP endpoints to admin controller handlers
 * with auth + admin middleware chains.
 */
import { Router } from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import { validateRequest } from "../middleware/validation.js";
import { adminUpdateRequestSchema } from "../validators/adminSchemas.js";
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

export default router;
