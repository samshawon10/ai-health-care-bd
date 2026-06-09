import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { env } from "./env.js";

export function hasFirebaseAdminConfig() {
  return Boolean(env.firebaseProjectId && env.firebaseClientEmail && env.firebasePrivateKey);
}

function normalizedPrivateKey() {
  return env.firebasePrivateKey.replace(/\\n/g, "\n");
}

export function getFirebaseAdminAuth() {
  if (!hasFirebaseAdminConfig()) {
    throw new Error("Firebase Admin is not configured.");
  }

  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId: env.firebaseProjectId,
          clientEmail: env.firebaseClientEmail,
          privateKey: normalizedPrivateKey()
        })
      });

  return getAuth(app);
}
