import { ClipboardCheck, HeartPulse, Info, ShieldAlert, Stethoscope } from "lucide-react";
import type { Guidance, GuidanceSource } from "@/types/health";
import { RiskBadge } from "./RiskBadge";

const sourceLabels: Record<GuidanceSource, string> = {
  openai: "OpenAI structured response",
  fallback: "Safe fallback response",
  rules: "Emergency rules response"
};

export function GuidancePanel({
  guidance,
  source,
  darkMode = false
}: {
  guidance: Guidance | null;
  source?: GuidanceSource | null;
  darkMode?: boolean;
}) {
  const cardClass = darkMode
    ? "border-white/10 bg-slate-900 text-slate-100 shadow-black/20"
    : "border-slate-200 bg-white text-slate-950 shadow-sm";
  const mutedClass = darkMode ? "text-slate-300" : "text-slate-700";

  if (!guidance) {
    return (
      <div className={`rounded-lg border border-dashed p-6 text-sm leading-6 ${darkMode ? "border-white/10 bg-white/[0.04] text-slate-300" : "border-slate-300 bg-white/80 text-slate-600"}`}>
        Structured health guidance will appear here after a symptom check, medical question, or report analysis.
      </div>
    );
  }

  const rows = [
    {
      label: "1. Possible Condition",
      value: guidance.possibleCondition,
      icon: Stethoscope
    },
    {
      label: "2. Risk Level",
      value: <RiskBadge risk={guidance.riskLevel} />,
      icon: ShieldAlert
    },
    {
      label: "3. Explanation",
      value: guidance.explanation,
      icon: Info
    },
    {
      label: "4. Recommendation",
      value: guidance.recommendation,
      icon: ClipboardCheck
    },
    {
      label: "5. Emergency Action",
      value: guidance.emergencyAction || "No immediate emergency action detected from the provided information.",
      icon: HeartPulse
    }
  ];

  return (
    <div className="space-y-3">
      {source ? (
        <div className={`rounded-lg border p-3 text-xs font-bold uppercase tracking-wide ${darkMode ? "border-white/10 bg-white/[0.04] text-slate-300" : "border-slate-200 bg-white text-slate-500"}`}>
          {sourceLabels[source]}
        </div>
      ) : null}
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <section key={row.label} className={`rounded-lg border p-4 ${cardClass}`}>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold">
              <Icon className="h-4 w-4 text-blue-500" aria-hidden="true" />
              {row.label}
            </div>
            <div className={`text-sm leading-6 ${mutedClass}`}>{row.value}</div>
          </section>
        );
      })}
      <p className={`rounded-lg border p-3 text-xs leading-5 ${darkMode ? "border-blue-400/20 bg-blue-400/10 text-blue-100" : "border-indigo-100 bg-indigo-50 text-indigo-950"}`}>
        {guidance.disclaimer}
      </p>
    </div>
  );
}
