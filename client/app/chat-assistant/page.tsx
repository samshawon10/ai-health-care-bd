import { HealthcareDashboard } from "@/components/HealthcareDashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function ChatAssistantPage() {
  return (
    <ProtectedRoute>
      <HealthcareDashboard initialView="chat" />
    </ProtectedRoute>
  );
}
