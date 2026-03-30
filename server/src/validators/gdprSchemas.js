/**
 * Zod Schemas for GDPR Endpoints
 *
 * Validates GDPR account deletion requests.
 */
import { z } from "zod/v4";

export const deleteAccountSchema = z.object({
  confirm: z.literal(true),
});
