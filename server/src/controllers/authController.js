/**
 * Auth Controller
 *
 * Thin HTTP handlers for authentication endpoints.
 * Delegates all business logic to authService.
 */
import * as authService from "../services/authService.js";
import { formatResponse } from "../helpers/formatResponse.js";

export async function syncProfile(req, res, next) {
  try {
    const { uid } = req.user;
    const profileData = req.body;

    const result = await authService.syncProfile(uid, profileData);

    res.status(200).json(formatResponse(result, "Profile synced"));
  } catch (error) {
    next(error);
  }
}

export async function verifyToken(req, res, next) {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res
        .status(400)
        .json(formatResponse(null, "Validation failed", "idToken is required"));
    }

    const result = await authService.verifyToken(idToken);

    res.status(200).json(formatResponse(result, "Token verified"));
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const { uid } = req.user;

    const result = await authService.getUser(uid);

    res.status(200).json(formatResponse(result, "User retrieved"));
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { uid } = req.user;
    const updates = req.body;

    const profile = await authService.updateProfile(uid, updates);

    res.status(200).json(formatResponse(profile, "Profile updated"));
  } catch (error) {
    next(error);
  }
}
