import { HealthcareDashboard } from "@/components/HealthcareDashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function MedicalReportsPage() {
  return (
    <ProtectedRoute>
      <HealthcareDashboard initialView="reports" />
    </ProtectedRoute>
  );
}
