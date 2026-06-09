import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleBasedDashboard } from "@/components/RoleBasedDashboard";

export default function ChildCareDashboardPage() {
  return (
    <ProtectedRoute>
      <RoleBasedDashboard requiredRole="guardian" />
    </ProtectedRoute>
  );
}
