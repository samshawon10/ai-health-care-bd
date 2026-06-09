import { HealthcareDashboard } from "@/components/HealthcareDashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <HealthcareDashboard />
    </ProtectedRoute>
  );
}
