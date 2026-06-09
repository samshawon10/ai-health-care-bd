import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleBasedDashboard } from "@/components/RoleBasedDashboard";

export default function DoctorDashboardPage() {
  return (
    <ProtectedRoute>
      <RoleBasedDashboard requiredRole="doctor" />
    </ProtectedRoute>
  );
}
