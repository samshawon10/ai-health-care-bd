import { CalendarClock } from "lucide-react";
import type { Guidance, RiskLevel } from "@/types/health";
import { RiskBadge } from "./RiskBadge";

export function HistoryCard({
  title,
  body,
  guidance,
  createdAt,
  fallbackRisk,
  onViewDetails,
  darkMode = false
}: {
  title: string;
  body: string;
  guidance?: Guidance;
  createdAt: string;
  fallbackRisk?: RiskLevel;
  onViewDetails?: () => void;
  darkMode?: boolean;
}) {
  const parsedDate = new Date(createdAt);
  const date = Number.isNaN(parsedDate.getTime())
    ? "Unknown time"
    : new Intl.DateTimeFormat("en-BD", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(parsedDate);

  return (
    <article className={`rounded-lg border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${darkMode ? "border-white/10 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-950"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold">{title}</h3>
          <p className={`mt-1 line-clamp-2 text-sm leading-6 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{body}</p>
        </div>
        <RiskBadge risk={guidance?.riskLevel || fallbackRisk || "Low"} />
      </div>
      {guidance?.recommendation ? (
        <p className={`mt-3 text-sm leading-6 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{guidance.recommendation}</p>
      ) : null}
      <div className={`mt-3 flex items-center gap-2 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
        <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
        {date}
      </div>
      {onViewDetails ? (
        <button
          className="focus-ring mt-3 inline-flex min-h-9 items-center rounded-lg border border-blue-100 bg-blue-50 px-3 text-xs font-black text-blue-700 transition hover:scale-[1.02]"
          type="button"
          onClick={onViewDetails}
        >
          View details
        </button>
      ) : null}
    </article>
  );
}
