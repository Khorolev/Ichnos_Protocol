/**
 * Auth Service
 *
 * Business logic for authentication operations including
 * profile synchronization, token verification, and user management.
 */
import firebaseAdmin from "../config/firebase.js";
import * as userRepository from "../repositories/userRepository.js";

const REQUIRED_PROFILE_FIELDS = ["name", "surname", "email"];

function buildError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function extractAdminFlag(customClaims) {
  return customClaims?.admin === true;
}

export function computeProfileState(profile) {
  const missingRequiredFields = REQUIRED_PROFILE_FIELDS.filter(
    (field) => !profile?.[field] || !String(profile[field]).trim(),
  );

  return {
    isProfileComplete: missingRequiredFields.length === 0,
    missingRequiredFields,
  };
}

export async function syncProfile(firebaseUid, profileData) {
  let user = await userRepository.getUserById(firebaseUid);

  if (!user) {
    user = await userRepository.createUser(firebaseUid);
  }

  const firebaseUser = await firebaseAdmin.auth().getUser(firebaseUid);
  const isAdmin = extractAdminFlag(firebaseUser.customClaims);

  const mergedProfile = {
    name: user?.name,
    surname: user?.surname,
    phone: user?.phone,
    company: user?.company,
    linkedin: user?.linkedin,
    ...Object.fromEntries(
      Object.entries(profileData).filter(([, v]) => v !== undefined),
    ),
    email: firebaseUser.email,
  };

  const profile = await userRepository.upsertProfile(
    firebaseUid,
    mergedProfile,
  );
  await userRepository.updateUserActivity(firebaseUid);

  const profileState = computeProfileState(profile);

  return { user, profile, isAdmin, profileState };
}

export async function verifyToken(idToken) {
  const decoded = await firebaseAdmin.auth().verifyIdToken(idToken);
  const customClaims = decoded || {};

  return { decoded, customClaims };
}

export async function getUser(firebaseUid) {
  const user = await userRepository.getUserById(firebaseUid);

  if (!user) {
    throw buildError("User not found", 404);
  }

  const firebaseUser = await firebaseAdmin.auth().getUser(firebaseUid);
  const isAdmin = extractAdminFlag(firebaseUser.customClaims);
  const canonicalUser = { ...user, email: firebaseUser.email ?? user.email };
  const profileState = computeProfileState(canonicalUser);

  return { user: canonicalUser, isAdmin, profileState };
}

export async function updateProfile(firebaseUid, updates) {
  const user = await userRepository.getUserById(firebaseUid);

  if (!user) {
    throw buildError("User not found", 404);
  }

  const profile = await userRepository.upsertProfile(firebaseUid, {
    ...user,
    ...updates,
  });
  await userRepository.updateUserActivity(firebaseUid);

  return profile;
}

export async function setAdminClaim(firebaseUid, isAdmin) {
  await firebaseAdmin
    .auth()
    .setCustomUserClaims(firebaseUid, { admin: isAdmin });

  return { firebaseUid, admin: isAdmin };
}
