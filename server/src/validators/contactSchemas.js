/**
 * Zod Schemas for Contact Endpoints
 *
 * Validates contact form submissions and request updates.
 */
import { z } from "zod/v4";

const questionSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Question cannot be empty")
    .max(2000, "Question cannot exceed 2000 characters"),
});

export const contactSubmitSchema = z.object({
  questions: z.array(questionSchema).min(1, "At least one question is required"),
  consentTimestamp: z.string().datetime({ offset: true }),
  consentVersion: z.string().min(1, "Consent version is required").max(20),
});

export const updateRequestSchema = z.object({
  status: z.enum(["new", "contacted", "in_progress", "resolved"]),
  adminNotes: z.string().max(5000).optional(),
});

export const addQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Question cannot be empty")
    .max(2000, "Question cannot exceed 2000 characters"),
});
