/**
 * Chat Routes
 *
 * Maps HTTP endpoints to chat controller handlers
 * with appropriate middleware chains.
 */
import { Router } from "express";
import auth from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import { chatMessageSchema } from "../validators/chatSchemas.js";
import * as chatController from "../controllers/chatController.js";

const router = Router();

router.post(
  "/message",
  auth,
  validateRequest(chatMessageSchema),
  chatController.sendMessage,
);

router.get("/history", auth, chatController.getChatHistory);

export default router;
