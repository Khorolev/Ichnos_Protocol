/**
 * Auth Service
 *
 * Business logic for authentication operations including
 * profile synchronization, token verification, and user management.
 */
import firebaseAdmin from "../config/firebase.js";
import * as userRepository from "../repositories/userRepository.js";

function buildError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function extractAdminFlag(customClaims) {
  return customClaims?.admin === true;
}

export async function syncProfile(firebaseUid, profileData) {
  let user = await userRepository.getUserById(firebaseUid);

  if (!user) {
    user = await userRepository.createUser(firebaseUid);
  }

  const profile = await userRepository.upsertProfile(
    firebaseUid,
    profileData,
  );
  await userRepository.updateUserActivity(firebaseUid);

  const firebaseUser = await firebaseAdmin.auth().getUser(firebaseUid);
  const isAdmin = extractAdminFlag(firebaseUser.customClaims);

  return { user, profile, isAdmin };
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

  return { user, isAdmin };
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
