import { HealthcareDashboard } from "@/components/HealthcareDashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function SymptomCheckerPage() {
  return (
    <ProtectedRoute>
      <HealthcareDashboard initialView="symptoms" />
    </ProtectedRoute>
  );
}
