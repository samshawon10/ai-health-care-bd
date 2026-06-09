import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleBasedDashboard } from "@/components/RoleBasedDashboard";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <RoleBasedDashboard />
    </ProtectedRoute>
  );
}
