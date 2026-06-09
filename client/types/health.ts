export type RiskLevel = "Low" | "Medium" | "High";
export type GuidanceSource = "openai" | "fallback" | "rules";
export type UserRole = "super_admin" | "doctor" | "patient" | "guardian" | "child_care" | "clinic_admin";
export type UserStatus = "active" | "pending" | "banned";

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
  clientId?: string;
  uid?: string;
  name?: string;
  email?: string;
  photoURL?: string;
  role?: UserRole;
  normalizedRole?: "super_admin" | "doctor" | "patient" | "guardian";
  status?: UserStatus;
  specialty?: string;
  licenseNumber?: string;
  assignedPatientIds?: string[];
  assignedDoctorIds?: string[];
  dependentIds?: string[];
  childProfiles?: ChildProfile[];
  age?: number;
  gender?: string;
  district?: string;
  bloodGroup?: string;
  knownConditions?: string[];
};

export type ChildProfile = {
  childId: string;
  name: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  knownConditions?: string[];
  relationship?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ClinicalNote = {
  _id: string;
  patientId: string;
  doctorId: string;
  type: "note" | "prescription" | "patient_message";
  title: string;
  content: string;
  status: "draft" | "sent" | "archived";
  createdAt: string;
  updatedAt: string;
};

export type RoleDashboardData = {
  role: "super_admin" | "doctor" | "patient" | "guardian";
  cards: Record<string, number>;
  profile?: UserProfile;
  doctor?: UserProfile;
  guardian?: UserProfile;
  recentUsers?: UserProfile[];
  assignedPatients?: UserProfile[];
  childProfiles?: ChildProfile[];
  healthChecks?: HealthCheck[];
  reports?: ReportAnalysis[];
  chatSessions?: ChatSession[];
  clinicalNotes?: ClinicalNote[];
  recentAlerts?: HealthCheck[];
  aiUsage?: {
    totalGenerations: number;
    healthChecks: number;
    chatSessions: number;
    reports: number;
  };
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
