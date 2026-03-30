/**
 * Zod Schemas for Chat Endpoints
 *
 * Validates chat message payloads.
 */
import { z } from "zod/v4";

export const chatMessageSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message cannot exceed 2000 characters"),
});
