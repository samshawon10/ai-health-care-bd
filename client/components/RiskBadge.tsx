import type { RiskLevel } from "@/types/health";

const riskStyles: Record<RiskLevel, string> = {
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  High: "border-rose-200 bg-rose-50 text-rose-700"
};

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span className={`inline-flex min-w-20 items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold ${riskStyles[risk]}`}>
      {risk} Risk
    </span>
  );
}
