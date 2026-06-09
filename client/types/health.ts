export type RiskLevel = "Low" | "Medium" | "High";
export type GuidanceSource = "openai" | "fallback" | "rules";

export type Guidance = {
  possibleCondition: string;
  riskLevel: RiskLevel;
  explanation: string;
  recommendation: string;
  emergencyAction: string;
  emergencyRequired: boolean;
  disclaimer: string;
  language: "Bangla" | "English" | "Mixed";
};

export type EmergencyResult = {
  isEmergency: boolean;
  riskLevel: RiskLevel;
  flags: string[];
  matchedTerms: string[];
};

export type HealthCheck = {
  _id: string;
  symptoms: string;
  guidance: Guidance;
  emergencyFlags: string[];
  matchedEmergencyTerms: string[];
  createdAt: string;
};

export type ChatSession = {
  _id: string;
  title: string;
  lastRiskLevel: RiskLevel;
  updatedAt: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    guidance?: Guidance;
    createdAt: string;
  }>;
};

export type ReportAnalysis = {
  _id: string;
  reportText: string;
  guidance: Guidance;
  createdAt: string;
};

export type UserProfile = {
  uid?: string;
  name?: string;
  email?: string;
  photoURL?: string;
  role?: "patient" | "doctor" | "clinic_admin";
  age?: number;
  gender?: string;
  district?: string;
  bloodGroup?: string;
  knownConditions?: string[];
};

export type StorageStatus = {
  available: boolean;
  saved?: boolean;
  error?: string | null;
};

export type SystemStatus = {
  status: "ok";
  database: "connected" | "disconnected";
  storageAvailable: boolean;
  firebaseAdminConfigured: boolean;
  firebaseAdminRequired: boolean;
  openaiConfigured: boolean;
  aiMode: "openai" | "fallback";
  model: string;
  emergencyAiSkipped: boolean;
};
