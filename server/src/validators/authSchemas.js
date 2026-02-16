/**
 * Zod Schemas for Authentication Endpoints
 *
 * Validates user profile data for sync and update operations.
 */
import { z } from "zod/v4";

export const syncProfileSchema = z.object({
  firebaseUid: z.string().min(1, "firebaseUid is required"),
  name: z.string().min(1, "Name is required").max(255),
  surname: z.string().min(1, "Surname is required").max(255),
  email: z.email("Invalid email address"),
  phone: z.string().max(50).optional(),
  company: z.string().max(255).optional(),
  linkedin: z.url("Invalid LinkedIn URL").max(500).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  surname: z.string().min(1).max(255).optional(),
  email: z.email("Invalid email address").optional(),
  phone: z.string().max(50).optional(),
  company: z.string().max(255).optional(),
  linkedin: z.url("Invalid LinkedIn URL").max(500).optional(),
});

export const adminClaimSchema = z.object({
  firebaseUid: z.string().min(1, "firebaseUid is required"),
  isAdmin: z.boolean(),
});
