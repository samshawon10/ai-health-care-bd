import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { Loader2, ShieldCheck, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { RiskLevel } from "@/types/health";

export const designTokens = {
  colors: {
    primary: "#2563EB",
    secondary: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    background: "#F8FAFC",
    text: "#0F172A"
  },
  radius: {
    sm: "12px",
    md: "16px",
    lg: "20px"
  },
  shadow: {
    card: "0 18px 55px rgba(37, 99, 235, 0.10)",
    soft: "0 10px 30px rgba(15, 23, 42, 0.08)"
  }
};

const buttonVariants = {
  primary:
    "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:scale-[1.02]",
  secondary:
    "border border-blue-100 bg-white/80 text-blue-700 shadow-sm hover:border-blue-200 hover:bg-blue-50",
  danger:
    "bg-rose-600 text-white shadow-lg shadow-rose-500/25 hover:scale-[1.02]",
  ghost:
    "border border-transparent text-slate-600 hover:border-blue-100 hover:bg-blue-50"
};

export function Button({
  children,
  variant = "primary",
  loading = false,
  icon: Icon,
  className = "",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
  loading?: boolean;
  icon?: LucideIcon;
}) {
  return (
    <button
      className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black transition ${buttonVariants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
  hover = true
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <section
      className={`rounded-[20px] border border-white/80 bg-white/82 p-5 shadow-xl shadow-blue-100/60 backdrop-blur-xl ${
        hover ? "transition hover:-translate-y-1 hover:shadow-2xl" : ""
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-blue-700">
      {children}
    </p>
  );
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const styles = {
    Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Medium: "border-amber-200 bg-amber-50 text-amber-700",
    High: "border-rose-200 bg-rose-50 text-rose-700"
  }[risk];

  return (
    <span className={`inline-flex min-h-8 min-w-24 items-center justify-center rounded-full border px-3 text-xs font-black ${styles}`}>
      {risk} Risk
    </span>
  );
}

export function Field({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-700">
      {label}
      <input
        className={`focus-ring min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-300 ${className}`}
        {...props}
      />
    </label>
  );
}

export function TextArea({
  label,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-700">
      {label}
      <textarea
        className={`focus-ring min-h-36 resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-300 ${className}`}
        {...props}
      />
    </label>
  );
}

export function ModalShell({
  title,
  children,
  onClose
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-[20px] border border-white/80 bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <button className="focus-ring grid h-9 w-9 place-items-center rounded-lg border border-slate-200" type="button" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Close modal</span>
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="AI is typing">
      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:120ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:240ms]" />
    </span>
  );
}

export function MedicalDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`rounded-lg border border-blue-100 bg-blue-50 text-blue-900 ${compact ? "p-3 text-xs" : "p-4 text-sm"}`}>
      <div className="flex items-start gap-2">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="font-semibold">This AI system does not replace professional medical advice.</p>
      </div>
    </div>
  );
}
