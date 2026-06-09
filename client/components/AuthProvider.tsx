"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setAuthTokenProvider } from "@/lib/api";
import { syncCurrentUserProfile } from "@/lib/auth";
import { getFirebaseAuth, hasFirebaseConfig } from "@/lib/firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  firebaseConfigured: boolean;
  error: string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const firebaseConfigured = hasFirebaseConfig();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(firebaseConfigured);
  const [sessionError, setSessionError] = useState("");
  const configurationError = firebaseConfigured
    ? ""
    : "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* values to client/.env.local.";

  useEffect(() => {
    if (!firebaseConfigured) {
      setAuthTokenProvider(null);
      return;
    }

    const auth = getFirebaseAuth();
    setAuthTokenProvider(async () => auth.currentUser?.getIdToken() || null);

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setSessionError("");
        setLoading(false);

        if (currentUser) {
          void syncCurrentUserProfile(currentUser);
        }
      },
      () => {
        setUser(null);
        setSessionError("Could not verify your session. Please sign in again.");
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      setAuthTokenProvider(null);
    };
  }, [firebaseConfigured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      firebaseConfigured,
      error: configurationError || sessionError
    }),
    [configurationError, firebaseConfigured, loading, sessionError, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
