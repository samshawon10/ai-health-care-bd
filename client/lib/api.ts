import type {
  ChatSession,
  EmergencyResult,
  Guidance,
  GuidanceSource,
  HealthCheck,
  ReportAnalysis,
  StorageStatus,
  SystemStatus,
  UserProfile
} from "@/types/health";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const API_ROOT_URL = API_BASE_URL.replace(/\/api\/?$/, "");
const REQUEST_TIMEOUT_MS = 25000;
let authTokenProvider: (() => Promise<string | null>) | null = null;

type ApiErrorPayload = {
  error?: string;
  code?: string;
  details?: {
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  };
};

function buildErrorMessage(payload: ApiErrorPayload) {
  const fieldErrors = payload.details?.fieldErrors
    ? Object.values(payload.details.fieldErrors).flat().filter(Boolean)
    : [];
  const formErrors = payload.details?.formErrors || [];
  const detail = [...fieldErrors, ...formErrors][0];

  return detail || payload.error || "Request failed. Please try again.";
}

export function setAuthTokenProvider(provider: (() => Promise<string | null>) | null) {
  authTokenProvider = provider;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const token = authTokenProvider ? await authTokenProvider() : null;
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(buildErrorMessage(payload));
    }

    return payload as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection and try again.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function getClientId() {
  if (typeof window === "undefined") {
    return "guest";
  }

  const existing = window.localStorage.getItem("healthcare_client_id");
  if (existing) {
    return existing;
  }

  const id = window.crypto?.randomUUID?.() || `guest-${Date.now()}`;
  window.localStorage.setItem("healthcare_client_id", id);
  return id;
}

export function createHealthCheck(input: {
  userId: string;
  symptoms: string;
  age?: number;
  sex?: string;
  location?: string;
}) {
  return request<{
    saved: boolean;
    healthCheck: HealthCheck | null;
    guidance: Guidance;
    emergency: EmergencyResult;
    source: GuidanceSource;
    model: string;
    warning?: string;
    storage?: StorageStatus;
  }>("/health-checks", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function sendChatMessage(input: {
  userId: string;
  sessionId?: string;
  message: string;
}) {
  return request<{
    saved: boolean;
    session: ChatSession | null;
    guidance: Guidance;
    emergency: EmergencyResult;
    source: GuidanceSource;
    model: string;
    warning?: string;
    storage?: StorageStatus;
  }>("/chats", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function analyzeReport(input: { userId: string; reportText: string }) {
  return request<{
    saved: boolean;
    report: ReportAnalysis | null;
    guidance: Guidance;
    emergency: EmergencyResult;
    source: GuidanceSource;
    model: string;
    warning?: string;
    storage?: StorageStatus;
  }>("/reports/analyze", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getHealthChecks(userId: string) {
  return request<{ healthChecks: HealthCheck[]; storageAvailable?: boolean; warning?: string }>(`/health-checks?userId=${encodeURIComponent(userId)}`);
}

export function getChatSessions(userId: string) {
  return request<{ sessions: ChatSession[]; storageAvailable?: boolean; warning?: string }>(`/chats?userId=${encodeURIComponent(userId)}`);
}

export function getReports(userId: string) {
  return request<{ reports: ReportAnalysis[]; storageAvailable?: boolean; warning?: string }>(`/reports?userId=${encodeURIComponent(userId)}`);
}

export function getProfile(clientId: string) {
  return request<{ user: (UserProfile & { clientId: string }) | null; storageAvailable?: boolean; warning?: string }>(`/users/profile/${clientId}`);
}

export function saveProfile(clientId: string, profile: UserProfile) {
  return request<{ user: UserProfile & { clientId: string } }>(`/users/profile/${clientId}`, {
    method: "PUT",
    body: JSON.stringify(profile)
  });
}

export function syncFirebaseProfile(profile: {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  role: "patient";
}) {
  return saveProfile(profile.uid, profile);
}

export async function getSystemStatus() {
  const response = await fetch(`${API_ROOT_URL}/api/status`, {
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Could not load system status.");
  }

  return (await response.json()) as SystemStatus;
}
