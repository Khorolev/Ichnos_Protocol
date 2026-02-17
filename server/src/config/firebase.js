/**
 * Firebase Admin SDK Singleton
 *
 * Uses a global reference to maintain a single Admin instance across
 * Vercel serverless invocations. On warm starts the existing instance
 * is reused, avoiding repeated initialization overhead.
 */
import admin from "firebase-admin";

function resolveStorageBucket() {
  const explicit = process.env.FIREBASE_STORAGE_BUCKET;
  if (explicit) return explicit;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (projectId) return `${projectId}.appspot.com`;

  throw new Error(
    "FIREBASE_STORAGE_BUCKET is not set and FIREBASE_PROJECT_ID is unavailable to derive it.",
  );
}

if (!globalThis.__firebaseAdmin) {
  try {
    const storageBucket = resolveStorageBucket();

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      storageBucket,
    });

    globalThis.__firebaseAdmin = admin;
  } catch (error) {
    console.error("Firebase Admin SDK initialization failed:", error.message);
    throw error;
  }
}

if (!globalThis.__firebaseStorage) {
  try {
    const bucketName = resolveStorageBucket();
    globalThis.__firebaseStorage = globalThis.__firebaseAdmin
      .storage()
      .bucket(bucketName);
  } catch (error) {
    console.error("Firebase Storage initialization failed:", error.message);
    throw error;
  }
}

const firebaseAdmin = globalThis.__firebaseAdmin;
export const storage = globalThis.__firebaseStorage;

export default firebaseAdmin;
