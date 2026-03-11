/**
 * Zod Schemas for Admin Endpoints
 *
 * Validates admin request updates.
 */
import { z } from "zod/v4";

export const adminManageAdminsSchema = z.object({
  action: z.enum(["add", "remove"]),
  email: z.string().email().max(255),
});

export const adminUpdateRequestSchema = z
  .object({
    status: z.enum(["new", "contacted", "in_progress", "resolved"]).optional(),
    adminNotes: z.string().max(5000).optional(),
  })
  .refine(
    (data) => data.status !== undefined || data.adminNotes !== undefined,
    { message: "At least one field must be provided" },
  );
