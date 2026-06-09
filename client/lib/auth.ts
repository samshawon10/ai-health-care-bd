import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User
} from "firebase/auth";
import { syncFirebaseProfile } from "@/lib/api";
import { ensureAuthPersistence, getFirebaseAuth, googleProvider } from "@/lib/firebase";

export type AuthResult = {
  user: User;
  profileWarning?: string;
};

function authErrorMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  const messages: Record<string, string> = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/network-request-failed": "Network error. Please check your connection and try again.",
    "auth/popup-closed-by-user": "Google sign-in was closed before completion.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/user-not-found": "No account was found for this email.",
    "auth/weak-password": "Password is too weak. Use at least 8 characters with a number.",
    "auth/wrong-password": "Email or password is incorrect."
  };

  return messages[code] || "Authentication failed. Please try again.";
}

export function validatePassword(password: string) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password)) return "Password must include at least one letter.";
  if (!/\d/.test(password)) return "Password must include at least one number.";
  return "";
}

async function persistUserProfile(user: User, fallbackName = "") {
  try {
    await syncFirebaseProfile({
      uid: user.uid,
      name: user.displayName || fallbackName || user.email?.split("@")[0] || "Patient",
      email: user.email || "",
      photoURL: user.photoURL || "",
      role: "patient"
    });

    return undefined;
  } catch {
    return "Signed in, but profile sync is temporarily unavailable.";
  }
}

export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    await ensureAuthPersistence();
    const credential = await signInWithPopup(getFirebaseAuth(), googleProvider);
    const profileWarning = await persistUserProfile(credential.user);
    return { user: credential.user, profileWarning };
  } catch (error) {
    throw new Error(authErrorMessage(error));
  }
}

export async function signUpWithEmail(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  try {
    const passwordError = validatePassword(input.password);
    if (passwordError) throw new Error(passwordError);

    await ensureAuthPersistence();
    const credential = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      input.email.trim(),
      input.password
    );

    await updateProfile(credential.user, {
      displayName: input.name.trim() || "Patient"
    });

    const profileWarning = await persistUserProfile(credential.user, input.name);
    return { user: credential.user, profileWarning };
  } catch (error) {
    if (error instanceof Error && !("code" in error)) {
      throw error;
    }

    throw new Error(authErrorMessage(error));
  }
}

export async function signInWithEmail(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  try {
    await ensureAuthPersistence();
    const credential = await signInWithEmailAndPassword(
      getFirebaseAuth(),
      input.email.trim(),
      input.password
    );
    const profileWarning = await persistUserProfile(credential.user);
    return { user: credential.user, profileWarning };
  } catch (error) {
    throw new Error(authErrorMessage(error));
  }
}

export async function sendResetEmail(email: string) {
  try {
    await ensureAuthPersistence();
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
  } catch (error) {
    throw new Error(authErrorMessage(error));
  }
}

export async function logout() {
  await signOut(getFirebaseAuth());
}

export async function syncCurrentUserProfile(user: User) {
  return persistUserProfile(user);
}
