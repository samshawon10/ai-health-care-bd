"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  Chrome,
  HeartPulse,
  Lock,
  Mail,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
  sendResetEmail,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
  validatePassword
} from "@/lib/auth";
import { Button, Card, Field, MedicalDisclaimer } from "./ui-system";

function nextPath() {
  if (typeof window === "undefined") return "/dashboard";
  const requestedPath = new URLSearchParams(window.location.search).get("next");
  return requestedPath?.startsWith("/") ? requestedPath : "/dashboard";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function AuthPage({ mode }: { mode: "sign-in" | "sign-up" }) {
  const isSignUp = mode === "sign-up";
  const router = useRouter();
  const { user, loading: authLoading, firebaseConfigured, error: authError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState<"google" | "email" | "reset" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(nextPath());
    }
  }, [authLoading, router, user]);

  async function completeAuth(action: () => Promise<{ profileWarning?: string }>) {
    setError("");
    setNotice("");
    const result = await action();
    if (result.profileWarning) {
      setNotice(result.profileWarning);
    }
    router.replace(nextPath());
  }

  async function handleGoogleAuth() {
    setSubmitting("google");
    try {
      await completeAuth(signInWithGoogle);
    } catch (authErrorValue) {
      setError(authErrorValue instanceof Error ? authErrorValue.message : "Google sign-in failed.");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (isSignUp) {
      if (!name.trim()) {
        setError("Please enter your full name.");
        return;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setSubmitting("email");
    try {
      await completeAuth(() =>
        isSignUp
          ? signUpWithEmail({ name, email, password })
          : signInWithEmail({ email, password })
      );
    } catch (authErrorValue) {
      setError(authErrorValue instanceof Error ? authErrorValue.message : "Authentication failed.");
    } finally {
      setSubmitting(null);
    }
  }

  async function handlePasswordReset() {
    setError("");
    setNotice("");

    if (!isValidEmail(email)) {
      setError("Enter your email first, then request a password reset.");
      return;
    }

    setSubmitting("reset");
    try {
      await sendResetEmail(email);
      setNotice("Password reset email sent. Please check your inbox.");
    } catch (authErrorValue) {
      setError(authErrorValue instanceof Error ? authErrorValue.message : "Could not send reset email.");
    } finally {
      setSubmitting(null);
    }
  }

  const disabled = authLoading || Boolean(submitting) || !firebaseConfigured;

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_48%,#ecfdf5_100%)] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <section className="rounded-[28px] border border-white/80 bg-white/72 p-6 shadow-2xl shadow-blue-100/70 backdrop-blur-xl lg:p-8">
          <Link className="flex items-center gap-3" href="/">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
              <HeartPulse className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-black">AI Healthcare Assistant</p>
              <p className="text-xs font-bold text-slate-500">Secure medical AI workspace</p>
            </div>
          </Link>
          <h1 className="mt-10 text-4xl font-black tracking-tight">
            {isSignUp ? "Create your healthcare AI account." : "Welcome back to your care dashboard."}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">
            Access symptom checks, emergency alerts, report explanations, and safe AI chat in one trusted workspace.
          </p>
          <div className="mt-8 grid gap-3">
            {["Firebase-secured sessions", "Google and email sign-in", "MongoDB profile sync"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-sm font-bold text-blue-900">
                <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <Card hover={false} className="mx-auto w-full max-w-md">
          <div className="text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              {isSignUp ? <UserRound className="h-5 w-5" aria-hidden="true" /> : <Lock className="h-5 w-5" aria-hidden="true" />}
            </div>
            <h2 className="mt-4 text-2xl font-black">{isSignUp ? "Start your free account" : "Sign in"}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {isSignUp ? "Create a secure patient profile." : "Continue to AI Healthcare Assistant."}
            </p>
          </div>

          <button
            className="focus-ring mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={disabled}
            onClick={() => void handleGoogleAuth()}
          >
            {submitting === "google" ? <ArrowRight className="h-4 w-4 animate-pulse" aria-hidden="true" /> : <Chrome className="h-4 w-4" aria-hidden="true" />}
            {isSignUp ? "Sign up with Google" : "Continue with Google"}
          </button>

          <div className="my-5 flex items-center gap-3 text-xs font-black uppercase tracking-wide text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            Email
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <form className="grid gap-4" onSubmit={handleEmailAuth}>
            {isSignUp ? (
              <Field
                label="Full name"
                placeholder="Patient name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            ) : null}
            <Field
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Field
              label="Password"
              type="password"
              placeholder="Minimum 8 characters"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {isSignUp ? (
              <Field
                label="Confirm password"
                type="password"
                placeholder="Repeat password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            ) : (
              <button className="w-fit text-sm font-black text-blue-600" type="button" onClick={() => void handlePasswordReset()} disabled={disabled}>
                {submitting === "reset" ? "Sending reset email..." : "Forgot password?"}
              </button>
            )}

            {error || authError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800" role="alert">
                {error || authError}
              </p>
            ) : null}
            {notice ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800" aria-live="polite">
                {notice}
              </p>
            ) : null}

            <Button className="w-full" icon={Mail} loading={submitting === "email"} disabled={disabled} type="submit">
              {isSignUp ? "Create account" : "Sign in securely"}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-slate-600">
            {isSignUp ? "Already have an account?" : "New to AI Healthcare?"}{" "}
            <Link className="font-black text-blue-600" href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"}>
              {isSignUp ? "Sign in" : "Create account"}
            </Link>
          </div>

          <div className="mt-5">
            <MedicalDisclaimer compact />
          </div>
        </Card>
      </div>
    </main>
  );
}
