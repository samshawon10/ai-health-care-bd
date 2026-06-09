import { AlertTriangle, Hospital } from "lucide-react";
import type { EmergencyResult, Guidance } from "@/types/health";

export function EmergencyAlert({
  emergency,
  guidance
}: {
  emergency?: EmergencyResult;
  guidance?: Guidance | null;
}) {
  if (!emergency?.isEmergency && !guidance?.emergencyRequired) {
    return null;
  }

  return (
    <div className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-rose-950 shadow-sm" role="alert">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-rose-600 p-2 text-white">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold">Emergency warning</h2>
            <Hospital className="h-4 w-4" aria-hidden="true" />
          </div>
          <p className="text-sm leading-6">
            {guidance?.emergencyAction ||
              "This may be urgent. Visit the nearest hospital or emergency department immediately."}
          </p>
          {emergency?.flags?.length ? (
            <p className="text-xs font-semibold text-rose-700">
              Detected: {emergency.flags.join(", ")}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
