/**
 * Contact Routes
 *
 * Maps HTTP endpoints to contact controller handlers
 * with appropriate middleware chains.
 */
import { Router } from "express";
import auth from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import {
  contactSubmitSchema,
  addQuestionSchema,
} from "../validators/contactSchemas.js";
import * as contactController from "../controllers/contactController.js";

const router = Router();

router.post(
  "/submit",
  auth,
  validateRequest(contactSubmitSchema),
  contactController.submitRequest,
);

router.get("/my-requests", auth, contactController.getMyRequests);

router.post(
  "/:id/question",
  auth,
  validateRequest(addQuestionSchema),
  contactController.addQuestion,
);

export default router;
