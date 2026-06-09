import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleBasedDashboard } from "@/components/RoleBasedDashboard";

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute>
      <RoleBasedDashboard requiredRole="super_admin" />
    </ProtectedRoute>
  );
}
