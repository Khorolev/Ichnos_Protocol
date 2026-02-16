/**
 * Firebase Admin SDK Singleton
 *
 * Uses a global reference to maintain a single Admin instance across
 * Vercel serverless invocations. On warm starts the existing instance
 * is reused, avoiding repeated initialization overhead.
 */
import admin from "firebase-admin";

if (!globalThis.__firebaseAdmin) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });

    globalThis.__firebaseAdmin = admin;
  } catch (error) {
    console.error("Firebase Admin SDK initialization failed:", error.message);
    throw error;
  }
}

const firebaseAdmin = globalThis.__firebaseAdmin;

export default firebaseAdmin;
