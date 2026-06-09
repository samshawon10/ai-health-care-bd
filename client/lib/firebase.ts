import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  type Auth
} from "firebase/auth";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const requiredConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId
];

let authInstance: Auth | null = null;
let analyticsInstance: Analytics | null = null;
let persistenceReady: Promise<void> | null = null;

export function hasFirebaseConfig() {
  return requiredConfig.every(Boolean);
}

export function getFirebaseApp(): FirebaseApp {
  if (!hasFirebaseConfig()) {
    throw new Error("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* values to client/.env.local.");
  }

  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth() {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
    authInstance.useDeviceLanguage();
  }

  return authInstance;
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function getFirebaseAnalytics() {
  if (analyticsInstance || typeof window === "undefined" || !firebaseConfig.measurementId) {
    return analyticsInstance;
  }

  if (await isSupported()) {
    analyticsInstance = getAnalytics(getFirebaseApp());
  }

  return analyticsInstance;
}

export async function ensureAuthPersistence() {
  if (!persistenceReady) {
    persistenceReady = setPersistence(getFirebaseAuth(), browserLocalPersistence);
  }

  await persistenceReady;
}
