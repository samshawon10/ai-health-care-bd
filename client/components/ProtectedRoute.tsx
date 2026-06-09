"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { HeartPulse, Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Button, MedicalDisclaimer } from "@/components/ui-system";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, firebaseConfigured, error } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && firebaseConfigured && !user) {
      router.replace(`/auth/sign-in?next=${encodeURIComponent(pathname || "/dashboard")}`);
    }
  }, [firebaseConfigured, loading, pathname, router, user]);

  if (!firebaseConfigured) {
    return <AuthGate message={error} mode="config" />;
  }

  if (loading) {
    return <AuthGate message="Verifying your secure healthcare session..." mode="loading" />;
  }

  if (!user) {
    return <AuthGate message="Redirecting to sign in..." mode="loading" />;
  }

  return children;
}

function AuthGate({ message, mode }: { message: string; mode: "loading" | "config" }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_52%,#ecfdf5_100%)] px-4 text-slate-950">
      <section className="w-full max-w-md rounded-[20px] border border-white/80 bg-white/86 p-6 text-center shadow-2xl shadow-blue-100/70 backdrop-blur-xl">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
          {mode === "loading" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ShieldAlert className="h-5 w-5" aria-hidden="true" />}
        </div>
        <h1 className="mt-4 text-2xl font-black">AI Healthcare Assistant</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        {mode === "config" ? (
          <div className="mt-5 grid gap-3">
            <Link href="/">
              <Button className="w-full" variant="secondary" icon={HeartPulse}>Back to home</Button>
            </Link>
            <MedicalDisclaimer compact />
          </div>
        ) : null}
      </section>
    </main>
  );
}
