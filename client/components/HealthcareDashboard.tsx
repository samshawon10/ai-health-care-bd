"use client";

import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  Bell,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Database,
  Download,
  FileSearch,
  FileText,
  HeartPulse,
  History,
  KeyRound,
  Languages,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  LogOut,
  MapPinned,
  Menu,
  MessageCircle,
  Moon,
  PhoneCall,
  Save,
  Search,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  Sun,
  UploadCloud,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  analyzeReport,
  createHealthCheck,
  getChatSessions,
  getClientId,
  getHealthChecks,
  getProfile,
  getReports,
  getSystemStatus,
  saveProfile,
  sendChatMessage
} from "@/lib/api";
import { logout } from "@/lib/auth";
import { compactText, formatPdfDate, guidanceBullets, openPrintablePdf, safetyDisclaimer } from "@/lib/pdfExport";
import type {
  ChatSession,
  EmergencyResult,
  Guidance,
  GuidanceSource,
  HealthCheck,
  ReportAnalysis,
  RiskLevel,
  StorageStatus,
  SystemStatus,
  UserProfile
} from "@/types/health";
import { GuidancePanel } from "./GuidancePanel";
import { HistoryCard } from "./HistoryCard";

type View = "dashboard" | "symptoms" | "emergency" | "reports" | "chat" | "history" | "settings";
type Language = "English" | "Bangla";

type DashboardHistoryItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  guidance?: Guidance;
  fallbackRisk?: RiskLevel;
  createdAt: string;
};

type Toast = {
  id: number;
  tone: "success" | "warning" | "error";
  message: string;
};

type ChatTurn = {
  id: number;
  role: "user" | "assistant";
  content: string;
  risk?: RiskLevel;
  timestamp?: string;
};

const navItems: Array<{ id: View; label: string; icon: LucideIcon }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "symptoms", label: "AI Symptom Checker", icon: Stethoscope },
  { id: "emergency", label: "Emergency Center", icon: Siren },
  { id: "reports", label: "Medical Reports", icon: FileText },
  { id: "chat", label: "Chat Assistant", icon: MessageCircle },
  { id: "history", label: "History", icon: History },
  { id: "settings", label: "Settings", icon: Settings }
];

const symptomExamples = [
  "High fever and cough for 2 days",
  "আমার বুক ব্যথা এবং শ্বাস নিতে কষ্ট হচ্ছে",
  "Mild headache but no chest pain"
];

const chatSuggestions = ["I have fever", "Chest pain", "Headache", "Skin infection"];

const emptyProfile: UserProfile = {
  uid: "",
  name: "Demo Patient",
  email: "",
  photoURL: "",
  role: "patient",
  age: undefined,
  gender: "",
  district: "Dhaka",
  bloodGroup: "",
  knownConditions: []
};

function formatAssistantReply(guidance: Guidance) {
  return [
    `Possible condition: ${guidance.possibleCondition}`,
    `Risk level: ${guidance.riskLevel}`,
    guidance.recommendation,
    guidance.emergencyAction
  ]
    .filter(Boolean)
    .join("\n");
}

function sourceLabel(source: GuidanceSource | null) {
  if (source === "openai") return "OpenAI structured analysis";
  if (source === "rules") return "Emergency rules engine";
  if (source === "fallback") return "Safe fallback mode";
  return "Ready";
}

function healthScoreForRisk(risk: RiskLevel) {
  if (risk === "High") return 42;
  if (risk === "Medium") return 74;
  return 92;
}

function messageTimestamp() {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date());
}

export function HealthcareDashboard({ initialView = "dashboard" }: { initialView?: View }) {
  const router = useRouter();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<View>(initialView);
  const [clientId, setClientId] = useState("guest");
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>("English");
  const [searchQuery, setSearchQuery] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [reportText, setReportText] = useState("");
  const [reportFileName, setReportFileName] = useState("");
  const [latestReportForPdf, setLatestReportForPdf] = useState<ReportAnalysis | null>(null);
  const [guidance, setGuidance] = useState<Guidance | null>(null);
  const [emergency, setEmergency] = useState<EmergencyResult | undefined>();
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [reports, setReports] = useState<ReportAnalysis[]>([]);
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [lastSource, setLastSource] = useState<GuidanceSource | null>(null);
  const [historyWarning, setHistoryWarning] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hello. I can help explain symptoms, reports, and next steps in Bangla or English.",
      timestamp: "Ready now"
    }
  ]);
  const [loading, setLoading] = useState<View | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  const patientName = profile.name?.trim() || "Demo Patient";
  const role =
    profile.role === "doctor" ? "Doctor" : profile.role === "clinic_admin" ? "Clinic Admin" : "Patient";
  const currentRisk = guidance?.riskLevel || "Low";
  const emergencyVisible = Boolean(emergency?.isEmergency || guidance?.emergencyRequired);
  const totalInteractions = healthChecks.length + chatSessions.length + reports.length;
  const emergencyAlertCount =
    healthChecks.filter((item) => item.guidance?.riskLevel === "High" || item.emergencyFlags?.length).length +
    (emergencyVisible ? 1 : 0);
  const healthScore = healthScoreForRisk(currentRisk);
  const canSubmitSymptoms = symptoms.trim().length >= 3 && loading !== "symptoms";
  const canSubmitChat = chatMessage.trim().length >= 3 && loading !== "chat";
  const canSubmitReport = reportText.trim().length >= 10 && loading !== "reports";

  const theme = {
    shell: darkMode
      ? "bg-slate-950 text-slate-100"
      : "bg-[linear-gradient(135deg,#edf7ff_0%,#f8fffd_45%,#f4f7fb_100%)] text-slate-950",
    sidebar: darkMode
      ? "border-white/10 bg-slate-950/85 text-slate-100 shadow-black/30"
      : "border-white/80 bg-white/78 text-slate-950 shadow-blue-100/70",
    card: darkMode
      ? "border-white/10 bg-white/[0.06] shadow-black/20"
      : "border-white/80 bg-white/82 shadow-blue-100/70",
    cardSolid: darkMode
      ? "border-white/10 bg-slate-900 text-slate-100 shadow-black/20"
      : "border-slate-200 bg-white text-slate-950 shadow-blue-100/70",
    soft: darkMode
      ? "border-white/10 bg-white/[0.04] text-slate-300"
      : "border-blue-100 bg-blue-50/70 text-slate-700",
    input: darkMode
      ? "border-white/10 bg-slate-950/70 text-slate-100 placeholder:text-slate-500"
      : "border-slate-200 bg-white/90 text-slate-950 placeholder:text-slate-400",
    muted: darkMode ? "text-slate-400" : "text-slate-500",
    subtleText: darkMode ? "text-slate-300" : "text-slate-600",
    navIdle: darkMode
      ? "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.06]"
      : "border-transparent text-slate-600 hover:border-blue-100 hover:bg-blue-50/80",
    navActive: "border-blue-500 bg-blue-600 text-white shadow-blue-500/20"
  };

  const addToast = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now();
    setToasts((current) => [...current, { id, tone, message }].slice(-3));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3800);
  }, []);

  const loadSystemStatus = useCallback(async () => {
    try {
      setSystemStatus(await getSystemStatus());
    } catch {
      setSystemStatus(null);
    }
  }, []);

  const loadProfile = useCallback(async (id: string) => {
    try {
      const response = await getProfile(id);
      if (response.warning) setHistoryWarning(response.warning);
      if (response.user) {
        setProfile({
          uid: response.user.uid || response.user.clientId || "",
          name: response.user.name || "Demo Patient",
          email: response.user.email || "",
          photoURL: response.user.photoURL || "",
          role: response.user.role || "patient",
          age: response.user.age,
          gender: response.user.gender || "",
          district: response.user.district || "Dhaka",
          bloodGroup: response.user.bloodGroup || "",
          knownConditions: response.user.knownConditions || []
        });
      }
    } catch {
      setHistoryWarning("Profile storage is unavailable.");
    }
  }, []);

  const loadHistory = useCallback(async (id: string) => {
    setHistoryLoading(true);
    try {
      const [checks, sessions, reportList] = await Promise.all([
        getHealthChecks(id),
        getChatSessions(id),
        getReports(id)
      ]);
      setHealthChecks(checks.healthChecks);
      setChatSessions(sessions.sessions);
      setReports(reportList.reports);
      setHistoryWarning(checks.warning || sessions.warning || reportList.warning || "");
    } catch {
      setHealthChecks([]);
      setChatSessions([]);
      setReports([]);
      setHistoryWarning("Could not load history right now.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = user?.uid || getClientId();
    const timer = window.setTimeout(() => {
      setClientId(id);
      window.localStorage.setItem("healthcare_client_id", id);
      if (user) {
        setProfile((current) => ({
          ...current,
          uid: user.uid,
          name: user.displayName || current.name || "Demo Patient",
          email: user.email || current.email || "",
          photoURL: user.photoURL || current.photoURL || "",
          role: current.role || "patient"
        }));
      }
      void loadSystemStatus();
      void loadProfile(id);
      void loadHistory(id);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadHistory, loadProfile, loadSystemStatus, user]);

  const latestItems = useMemo<DashboardHistoryItem[]>(() => {
    const health = healthChecks.map((item) => ({
      id: `check-${item._id}`,
      type: "Symptom Check",
      title: "Symptoms reviewed",
      body: item.symptoms,
      guidance: item.guidance,
      createdAt: item.createdAt
    }));
    const chats = chatSessions.map((item) => ({
      id: `chat-${item._id}`,
      type: "Chat",
      title: item.title,
      body: item.messages?.[0]?.content || "Health conversation",
      guidance: item.messages?.find((message) => message.role === "assistant")?.guidance,
      fallbackRisk: item.lastRiskLevel,
      createdAt: item.updatedAt
    }));
    const reportItems = reports.map((item) => ({
      id: `report-${item._id}`,
      type: "Report",
      title: "Report analyzed",
      body: item.reportText,
      guidance: item.guidance,
      createdAt: item.createdAt
    }));

    return [...health, ...chats, ...reportItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [chatSessions, healthChecks, reports]);

  function updateResultState(
    response: {
      saved: boolean;
      source: GuidanceSource;
      warning?: string;
      storage?: StorageStatus;
    },
    label: string
  ) {
    setLastSource(response.source);
    setHistoryWarning(response.storage?.error || response.warning || "");

    const labelText =
      response.source === "openai"
        ? "OpenAI"
        : response.source === "rules"
          ? "emergency rules"
          : "safe fallback";

    if (response.storage?.error) {
      setStatus(`${label} generated by ${labelText}, but storage failed.`);
      addToast("Storage failed. The answer is still available.", "warning");
      return;
    }

    if (response.storage?.available === false || !response.saved) {
      setStatus(`${label} generated by ${labelText}. MongoDB is offline, so it was not saved.`);
      addToast(`${label} ready. Storage is offline.`, "warning");
      return;
    }

    setStatus(`${label} generated by ${labelText} and saved.`);
    addToast(`${label} saved successfully.`);
  }

  async function submitSymptoms(event?: FormEvent) {
    event?.preventDefault();
    setError("");
    setStatus("");
    setLoading("symptoms");
    try {
      const response = await createHealthCheck({
        userId: clientId,
        symptoms,
        age: profile.age,
        sex: profile.gender,
        location: profile.district
      });
      setGuidance(response.guidance);
      setEmergency(response.emergency);
      if (response.emergency?.isEmergency || response.guidance.emergencyRequired) {
        setEmergencyModalOpen(true);
      }
      updateResultState(response, "Health check");
      setSymptoms("");
      void loadHistory(clientId);
      void loadSystemStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not check symptoms.";
      setError(message);
      addToast(message, "error");
    } finally {
      setLoading(null);
    }
  }

  async function submitChat(event?: FormEvent, suggestion?: string) {
    event?.preventDefault();
    const message = (suggestion || chatMessage).trim();
    if (message.length < 3) return;

    setError("");
    setStatus("");
    setLoading("chat");
    setAiTyping(true);
    setChatTurns((current) => [
      ...current,
      { id: Date.now(), role: "user", content: message, timestamp: messageTimestamp() }
    ]);

    try {
      const response = await sendChatMessage({
        userId: clientId,
        message
      });
      setGuidance(response.guidance);
      setEmergency(response.emergency);
      if (response.emergency?.isEmergency || response.guidance.emergencyRequired) {
        setEmergencyModalOpen(true);
      }
      updateResultState(response, "Chat response");
      setChatTurns((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: formatAssistantReply(response.guidance),
          risk: response.guidance.riskLevel,
          timestamp: messageTimestamp()
        }
      ]);
      setChatMessage("");
      void loadHistory(clientId);
      void loadSystemStatus();
    } catch (err) {
      const messageText = err instanceof Error ? err.message : "Could not send message.";
      setError(messageText);
      addToast(messageText, "error");
    } finally {
      setAiTyping(false);
      setLoading(null);
    }
  }

  async function submitReport(event: FormEvent) {
    event.preventDefault();
    setError("");
    setStatus("");
    setLoading("reports");
    try {
      const submittedReportText = reportText.trim();
      const response = await analyzeReport({
        userId: clientId,
        reportText: submittedReportText
      });
      setGuidance(response.guidance);
      setEmergency(response.emergency);
      setLatestReportForPdf(
        response.report || {
          _id: `local-report-${Date.now()}`,
          reportText: submittedReportText,
          guidance: response.guidance,
          createdAt: new Date().toISOString()
        }
      );
      if (response.emergency?.isEmergency || response.guidance.emergencyRequired) {
        setEmergencyModalOpen(true);
      }
      updateResultState(response, "Report analysis");
      setReportText("");
      setReportFileName("");
      void loadHistory(clientId);
      void loadSystemStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not analyze report.";
      setError(message);
      addToast(message, "error");
    } finally {
      setLoading(null);
    }
  }

  async function submitProfile(event: FormEvent) {
    event.preventDefault();
    setError("");
    setStatus("");
    setLoading("settings");
    try {
      const cleaned = {
        ...profile,
        knownConditions: (profile.knownConditions || []).filter(Boolean)
      };
      await saveProfile(clientId, cleaned);
      setStatus("Profile saved.");
      setHistoryWarning("");
      addToast("Profile saved.");
      void loadSystemStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save profile.";
      setError(message);
      addToast(message, "error");
    } finally {
      setLoading(null);
    }
  }

  function loadHistoryDetails(item: DashboardHistoryItem) {
    if (item.guidance) {
      setGuidance(item.guidance);
      setLastSource(null);
      addToast("History details loaded.");
      setActiveView("symptoms");
    }
  }

  function handleSos() {
    setActiveView("emergency");
    setEmergencyModalOpen(true);
    addToast("Emergency center opened. Call 999 for urgent help.", "warning");
  }

  async function handleLogout() {
    try {
      await logout();
      router.replace("/auth/sign-in");
    } catch {
      addToast("Could not sign out. Please try again.", "error");
    }
  }

  function handleExportData() {
    const exportedAt = new Date().toISOString();
    const exportPayload = {
      product: "AI Healthcare Assistant",
      exportVersion: 1,
      exportedAt,
      user: {
        uid: user?.uid || clientId,
        name: profile.name || "",
        email: profile.email || "",
        role: profile.role || "patient",
        photoURL: profile.photoURL || "",
        age: profile.age,
        gender: profile.gender || "",
        district: profile.district || "",
        bloodGroup: profile.bloodGroup || "",
        knownConditions: profile.knownConditions || []
      },
      summary: {
        currentRisk,
        healthScore,
        emergencyAlerts: emergencyAlertCount,
        healthChecks: healthChecks.length,
        chatSessions: chatSessions.length,
        reports: reports.length,
        totalInteractions
      },
      data: {
        healthChecks,
        chatSessions,
        reports
      },
      safety: {
        disclaimer: safetyDisclaimer
      }
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json"
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStamp = exportedAt.slice(0, 10);
    link.href = url;
    link.download = `ai-healthcare-data-export-${dateStamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    addToast("Your JSON healthcare data export has downloaded.");
  }

  function handleDownloadReportPdf() {
    const exportedAt = new Date().toISOString();
    const draftText = reportText.trim();
    const selectedReport = latestReportForPdf || reports[0] || null;
    const sourceText = selectedReport?.reportText || draftText;

    if (!sourceText) {
      addToast("Analyze or paste a report before downloading a PDF.", "warning");
      return;
    }

    const opened = openPrintablePdf({
      title: "Medical Report Analysis",
      subtitle: "Plain-language AI explanation for patient review and clinician follow-up.",
      patientName,
      exportedAt,
      sections: [
        {
          heading: "Patient profile",
          rows: [
            ["Name", profile.name],
            ["Email", profile.email],
            ["Role", role],
            ["District", profile.district],
            ["Blood group", profile.bloodGroup]
          ]
        },
        {
          heading: "Report source",
          rows: [
            ["Report file", reportFileName || "Manual text input"],
            ["Analyzed at", selectedReport?.createdAt ? formatPdfDate(selectedReport.createdAt) : "Not analyzed yet"]
          ],
          paragraphs: [sourceText]
        },
        {
          heading: "AI explanation",
          bullets: guidanceBullets(selectedReport?.guidance || null)
        }
      ]
    });

    addToast(
      opened ? "PDF view opened. Choose Save as PDF in the print dialog." : "Popup blocked. Allow popups and try again.",
      opened ? "success" : "error"
    );
  }

  function handleExportPdf() {
    const exportedAt = new Date().toISOString();
    const knownConditions = (profile.knownConditions || []).filter(Boolean).join(", ");
    const recentChecks = healthChecks.slice(0, 8).map((item) =>
      [
        formatPdfDate(item.createdAt),
        `Risk: ${item.guidance?.riskLevel || "Low"}`,
        `Symptoms: ${compactText(item.symptoms)}`,
        `Recommendation: ${compactText(item.guidance?.recommendation || "No recommendation saved.")}`
      ].join(" | ")
    );
    const recentChats = chatSessions.slice(0, 8).map((session) => {
      const lastGuidance = [...session.messages].reverse().find((message) => message.guidance)?.guidance;
      return [
        formatPdfDate(session.updatedAt),
        `Risk: ${session.lastRiskLevel}`,
        `Topic: ${compactText(session.title || "Chat session")}`,
        lastGuidance ? `Recommendation: ${compactText(lastGuidance.recommendation)}` : "No structured guidance saved."
      ].join(" | ");
    });
    const recentReports = reports.slice(0, 8).map((report) =>
      [
        formatPdfDate(report.createdAt),
        `Risk: ${report.guidance?.riskLevel || "Low"}`,
        `Condition: ${compactText(report.guidance?.possibleCondition || "Report analysis")}`,
        `Report: ${compactText(report.reportText)}`
      ].join(" | ")
    );

    const opened = openPrintablePdf({
      title: "Healthcare Data Export",
      subtitle: "Printable summary of saved profile, symptom checks, chats, and medical report analyses.",
      patientName,
      exportedAt,
      sections: [
        {
          heading: "Patient profile",
          rows: [
            ["UID", user?.uid || clientId],
            ["Name", profile.name],
            ["Email", profile.email],
            ["Role", role],
            ["Age", profile.age],
            ["Gender", profile.gender],
            ["District", profile.district],
            ["Blood group", profile.bloodGroup],
            ["Known conditions", knownConditions]
          ]
        },
        {
          heading: "Health summary",
          rows: [
            ["Current risk", currentRisk],
            ["Health score", `${healthScore}/100`],
            ["Emergency alerts", emergencyAlertCount],
            ["Symptom checks", healthChecks.length],
            ["Chat sessions", chatSessions.length],
            ["Reports", reports.length],
            ["Total saved interactions", totalInteractions]
          ]
        },
        {
          heading: "Recent symptom checks",
          bullets: recentChecks.length ? recentChecks : ["No saved symptom checks yet."]
        },
        {
          heading: "Recent chat sessions",
          bullets: recentChats.length ? recentChats : ["No saved chat sessions yet."]
        },
        {
          heading: "Recent medical reports",
          bullets: recentReports.length ? recentReports : ["No saved report analyses yet."]
        }
      ]
    });

    addToast(
      opened ? "PDF export opened. Choose Save as PDF in the print dialog." : "Popup blocked. Allow popups and try again.",
      opened ? "success" : "error"
    );
  }

  const primaryContent = (
    <div className="space-y-5">
      {activeView === "dashboard" ? (
        <>
          <HeroCard
            name={patientName}
            theme={theme}
            darkMode={darkMode}
            onCheckSymptoms={() => setActiveView("symptoms")}
          />
          <HealthStatusGrid
            theme={theme}
            risk={currentRisk}
            recentCheckups={healthChecks.length}
            emergencyAlerts={emergencyAlertCount}
            healthScore={healthScore}
          />
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
            <SymptomCheckerSection
              theme={theme}
              symptoms={symptoms}
              loading={loading === "symptoms"}
              disabled={!canSubmitSymptoms}
              onChange={setSymptoms}
              onSubmit={submitSymptoms}
            />
            <ChatWidget
              theme={theme}
              turns={chatTurns}
              value={chatMessage}
              loading={loading === "chat"}
              aiTyping={aiTyping}
              disabled={!canSubmitChat}
              onChange={setChatMessage}
              onSubmit={submitChat}
            />
          </div>
          {guidance ? <GuidancePanel guidance={guidance} source={lastSource} darkMode={darkMode} /> : null}
          {emergencyVisible ? <EmergencyCenterPanel theme={theme} emergency={emergency} guidance={guidance} /> : null}
          <HistorySection
            theme={theme}
            darkMode={darkMode}
            items={latestItems}
            warning={historyWarning}
            loading={historyLoading}
            onRefresh={() => void loadHistory(clientId)}
            onViewDetails={loadHistoryDetails}
          />
        </>
      ) : null}

      {activeView === "symptoms" ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <SymptomCheckerSection
            theme={theme}
            symptoms={symptoms}
            loading={loading === "symptoms"}
            disabled={!canSubmitSymptoms}
            onChange={setSymptoms}
            onSubmit={submitSymptoms}
          />
          <GuidancePanel guidance={guidance} source={lastSource} darkMode={darkMode} />
        </div>
      ) : null}

      {activeView === "emergency" ? (
        <EmergencyCenterPanel theme={theme} emergency={emergency} guidance={guidance} alwaysVisible />
      ) : null}

      {activeView === "reports" ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <ReportsSection
            theme={theme}
            reportText={reportText}
            fileName={reportFileName}
            loading={loading === "reports"}
            disabled={!canSubmitReport}
            onChange={setReportText}
            onFileNameChange={setReportFileName}
            onDownloadReport={handleDownloadReportPdf}
            onSubmit={submitReport}
          />
          <GuidancePanel guidance={guidance} source={lastSource} darkMode={darkMode} />
        </div>
      ) : null}

      {activeView === "chat" ? (
        <ChatWidget
          theme={theme}
          turns={chatTurns}
          value={chatMessage}
          loading={loading === "chat"}
          aiTyping={aiTyping}
          disabled={!canSubmitChat}
          expanded
          onChange={setChatMessage}
          onSubmit={submitChat}
        />
      ) : null}

      {activeView === "history" ? (
        <HistorySection
          theme={theme}
          darkMode={darkMode}
          items={latestItems}
          warning={historyWarning}
          loading={historyLoading}
          onRefresh={() => void loadHistory(clientId)}
          onViewDetails={loadHistoryDetails}
        />
      ) : null}

      {activeView === "settings" ? (
        <SettingsSection
          theme={theme}
          profile={profile}
          loading={loading === "settings"}
          language={language}
          darkMode={darkMode}
          onProfileChange={setProfile}
          onSubmit={submitProfile}
          onToggleDark={() => setDarkMode((value) => !value)}
          onToggleLanguage={() => {
            setLanguage((value) => (value === "English" ? "Bangla" : "English"));
            addToast("Language preference updated.");
          }}
          healthChecksCount={healthChecks.length}
          reportsCount={reports.length}
          totalInteractions={totalInteractions}
          onSecurityAction={(label) =>
            addToast(
              label === "Password"
                ? "Use Forgot password on the sign-in page to reset your password."
                : "Two-factor authentication can be enabled from Firebase Authentication MFA settings.",
              "warning"
            )
          }
          onExportData={handleExportData}
          onExportPdf={handleExportPdf}
        />
      ) : null}
    </div>
  );

  return (
    <main className={`min-h-screen transition-colors duration-300 ${theme.shell}`}>
      <ToastStack toasts={toasts} />
      <FloatingSos onClick={handleSos} />
      {emergencyModalOpen ? (
        <EmergencyModal
          theme={theme}
          emergency={emergency}
          guidance={guidance}
          onClose={() => setEmergencyModalOpen(false)}
          onShareLocation={() => addToast("Location sharing requires browser permission in production.", "warning")}
        />
      ) : null}

      {mobileNavOpen ? (
        <button
          className="fixed inset-0 z-20 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside className={`fixed inset-y-0 left-0 z-30 w-72 -translate-x-full border p-4 shadow-xl backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${mobileNavOpen ? "translate-x-0" : ""} ${theme.sidebar}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
                <HeartPulse className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-500">AI Healthcare</p>
                <h1 className="text-lg font-black leading-tight">Assistant</h1>
              </div>
            </div>
            <button className={`focus-ring grid h-10 w-10 place-items-center rounded-lg border lg:hidden ${theme.input}`} type="button" onClick={() => setMobileNavOpen(false)}>
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Close navigation</span>
            </button>
          </div>

          <div className={`mt-5 rounded-lg border p-3 ${theme.soft}`}>
            <div className="flex items-center gap-2 text-sm font-bold">
              <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              Clinical safety layer
            </div>
            <p className={`mt-2 text-xs leading-5 ${theme.subtleText}`}>
              Emergency rules run before AI analysis for safer triage.
            </p>
          </div>

          <nav className="mt-5 grid gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  className={`focus-ring flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm font-bold transition duration-200 hover:scale-[1.01] ${
                    isActive ? theme.navActive : theme.navIdle
                  }`}
                  onClick={() => {
                    setActiveView(item.id);
                    setMobileNavOpen(false);
                  }}
                  type="button"
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <button
            className={`focus-ring mt-5 flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm font-bold transition hover:scale-[1.01] lg:mt-auto ${theme.navIdle}`}
            type="button"
            onClick={() => {
              setMobileNavOpen(false);
              void handleLogout();
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <TopNavbar
            theme={theme}
            patientName={patientName}
            photoURL={profile.photoURL}
            role={role}
            darkMode={darkMode}
            language={language}
            emergencyCount={emergencyAlertCount}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onToggleDark={() => setDarkMode((value) => !value)}
            onToggleLanguage={() => {
              setLanguage((value) => (value === "English" ? "Bangla" : "English"));
              addToast("Language preference updated.");
            }}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />

          <SystemStatusStrip
            theme={theme}
            status={systemStatus}
            lastSource={lastSource}
            historyWarning={historyWarning}
            totalInteractions={totalInteractions}
          />

          {error ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800" role="alert">
              {error}
            </div>
          ) : null}
          {status ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800" aria-live="polite">
              {status}
            </div>
          ) : null}

          <div className="mt-5 animate-card-in">{primaryContent}</div>
        </div>
      </div>
    </main>
  );
}

function TopNavbar({
  theme,
  patientName,
  photoURL,
  role,
  darkMode,
  language,
  emergencyCount,
  searchQuery,
  onSearchChange,
  onToggleDark,
  onToggleLanguage,
  onOpenMobileNav
}: {
  theme: DashboardTheme;
  patientName: string;
  photoURL?: string;
  role: string;
  darkMode: boolean;
  language: Language;
  emergencyCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onToggleDark: () => void;
  onToggleLanguage: () => void;
  onOpenMobileNav: () => void;
}) {
  return (
    <header className={`sticky top-0 z-10 rounded-lg border p-3 shadow-lg backdrop-blur-xl ${theme.card}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <button className={`focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-lg border lg:hidden ${theme.input}`} type="button" onClick={onOpenMobileNav}>
            <Menu className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Open navigation</span>
          </button>
          <label className={`focus-within:ring-3 flex min-h-11 flex-1 items-center gap-2 rounded-lg border px-3 transition ${theme.input}`}>
            <Search className="h-4 w-4 text-blue-500" aria-hidden="true" />
            <span className="sr-only">Search dashboard</span>
            <input
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Search reports, symptoms, checkups..."
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button className={`focus-ring relative grid h-11 w-11 place-items-center rounded-lg border ${theme.input}`} type="button">
            <Bell className="h-4 w-4" aria-hidden="true" />
            {emergencyCount ? (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white">
                {emergencyCount}
              </span>
            ) : null}
          </button>
          <button className={`focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-bold ${theme.input}`} type="button" onClick={onToggleLanguage}>
            <Languages className="h-4 w-4" aria-hidden="true" />
            {language}
          </button>
          <button className={`focus-ring grid h-11 w-11 place-items-center rounded-lg border ${theme.input}`} type="button" onClick={onToggleDark}>
            {darkMode ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </button>
          <div className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 ${theme.input}`}>
            <Avatar name={patientName} photoURL={photoURL} size="sm" />
            <div>
              <p className="text-sm font-black leading-tight">{patientName}</p>
              <p className={`text-xs ${theme.muted}`}>{role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

type DashboardTheme = {
  card: string;
  cardSolid: string;
  input: string;
  muted: string;
  subtleText: string;
  soft: string;
};

function Avatar({
  name,
  photoURL,
  size
}: {
  name: string;
  photoURL?: string;
  size: "sm" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((part) => part.slice(0, 1))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const sizeClass = size === "lg" ? "h-16 w-16 text-lg" : "h-8 w-8 text-xs";

  if (photoURL) {
    return (
      <span
        className={`block shrink-0 rounded-full bg-cover bg-center shadow-lg shadow-blue-500/20 ${sizeClass}`}
        role="img"
        aria-label={`${name} profile photo`}
        style={{ backgroundImage: `url("${photoURL}")` }}
      />
    );
  }

  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-emerald-400 font-black text-white shadow-lg shadow-blue-500/20 ${sizeClass}`}>
      {initials || "P"}
    </span>
  );
}

function HeroCard({
  name,
  theme,
  darkMode,
  onCheckSymptoms
}: {
  name: string;
  theme: DashboardTheme;
  darkMode: boolean;
  onCheckSymptoms: () => void;
}) {
  return (
    <section className={`overflow-hidden rounded-lg border p-5 shadow-xl backdrop-blur-xl sm:p-6 ${theme.card}`}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
        <div>
          <p className="mb-2 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
            Medical AI dashboard
          </p>
          <h2 className="text-3xl font-black tracking-normal sm:text-4xl">Welcome back, {name}</h2>
          <p className={`mt-3 max-w-2xl text-sm leading-6 sm:text-base ${theme.subtleText}`}>
            Your AI health assistant is ready to help you today with safer symptom checks, report explanations, and emergency guidance.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:scale-[1.02]" type="button" onClick={onCheckSymptoms}>
              <Stethoscope className="h-4 w-4" aria-hidden="true" />
              Check Symptoms
            </button>
            <a className={`focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition hover:scale-[1.02] ${theme.input}`} href="tel:999">
              <PhoneCall className="h-4 w-4" aria-hidden="true" />
              Call Emergency
            </a>
          </div>
        </div>
        <div className={`rounded-lg border p-4 ${darkMode ? "border-cyan-400/20 bg-cyan-400/10" : "border-cyan-100 bg-cyan-50/80"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wide ${theme.muted}`}>AI care readiness</p>
              <p className="mt-1 text-3xl font-black">98%</p>
            </div>
            <BrainCircuit className="h-10 w-10 text-cyan-500" aria-hidden="true" />
          </div>
          <div className="mt-4 h-2 rounded-full bg-white/60">
            <div className="h-2 w-[98%] rounded-full bg-gradient-to-r from-blue-600 to-emerald-400" />
          </div>
          <p className={`mt-3 text-xs leading-5 ${theme.subtleText}`}>Emergency detection, structured output, and safe fallback are enabled.</p>
        </div>
      </div>
    </section>
  );
}

function HealthStatusGrid({
  theme,
  risk,
  recentCheckups,
  emergencyAlerts,
  healthScore
}: {
  theme: DashboardTheme;
  risk: RiskLevel;
  recentCheckups: number;
  emergencyAlerts: number;
  healthScore: number;
}) {
  const cards = [
    { label: "AI Risk Level", value: risk, icon: ShieldCheck, tone: risk === "High" ? "rose" : risk === "Medium" ? "amber" : "emerald" },
    { label: "Recent Checkups", value: recentCheckups.toString(), icon: ClipboardList, tone: "blue" },
    { label: "Emergency Alerts", value: emergencyAlerts.toString(), icon: Siren, tone: emergencyAlerts ? "rose" : "emerald" },
    { label: "Health Score", value: `${healthScore}/100`, icon: Activity, tone: "cyan" }
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className={`animate-card-in rounded-lg border p-4 shadow-lg backdrop-blur-xl ${theme.card}`}>
          <div className="flex items-center justify-between">
            <p className={`text-sm font-bold ${theme.muted}`}>{card.label}</p>
            <div className={`grid h-10 w-10 place-items-center rounded-lg ${toneClass(card.tone)}`}>
              <card.icon className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black">{card.value}</p>
        </article>
      ))}
    </section>
  );
}

function SymptomCheckerSection({
  theme,
  symptoms,
  loading,
  disabled,
  onChange,
  onSubmit
}: {
  theme: DashboardTheme;
  symptoms: string;
  loading: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: (event?: FormEvent) => void;
}) {
  return (
    <section className={`rounded-lg border p-5 shadow-xl backdrop-blur-xl ${theme.card}`}>
      <SectionHeader icon={Stethoscope} title="AI Symptom Checker" description="Describe symptoms in Bangla or English for structured guidance." theme={theme} />
      <form className="mt-4 space-y-4" onSubmit={onSubmit}>
        <textarea
          className={`focus-ring min-h-44 w-full resize-y rounded-lg border p-4 text-sm leading-6 outline-none transition ${theme.input}`}
          placeholder="Describe your symptoms (Bangla or English)..."
          value={symptoms}
          onChange={(event) => onChange(event.target.value)}
          maxLength={2000}
          required
        />
        <div className="flex flex-wrap gap-2">
          {symptomExamples.map((example) => (
            <button key={example} className={`focus-ring rounded-lg border px-3 py-2 text-xs font-bold transition hover:scale-[1.02] ${theme.input}`} type="button" onClick={() => onChange(example)}>
              {example}
            </button>
          ))}
        </div>
        <PrimaryButton loading={loading} disabled={disabled} icon={Sparkles} label="Analyze with AI" />
      </form>
    </section>
  );
}

function EmergencyCenterPanel({
  theme,
  emergency,
  guidance,
  alwaysVisible = false
}: {
  theme: DashboardTheme;
  emergency?: EmergencyResult;
  guidance?: Guidance | null;
  alwaysVisible?: boolean;
}) {
  if (!alwaysVisible && !emergency?.isEmergency && !guidance?.emergencyRequired) return null;

  return (
    <section className="rounded-lg border border-rose-300 bg-rose-50 p-5 text-rose-950 shadow-xl shadow-rose-100" role="alert">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-rose-600 text-white shadow-lg shadow-rose-500/30">
            <Siren className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-rose-700">Emergency Center</p>
            <h2 className="mt-1 text-xl font-black">High-risk symptoms need immediate care</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6">
              {guidance?.emergencyAction || "If this is urgent, call emergency services or visit the nearest hospital now."}
            </p>
            {emergency?.flags?.length ? <p className="mt-2 text-xs font-bold text-rose-700">Detected: {emergency.flags.join(", ")}</p> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-rose-500/25 transition hover:scale-[1.02]" href="tel:999">
            <PhoneCall className="h-4 w-4" aria-hidden="true" />
            Call Emergency
          </a>
          <a className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-black text-rose-700 transition hover:scale-[1.02]" href="https://www.google.com/maps/search/hospital+near+me" target="_blank" rel="noreferrer">
            <MapPinned className="h-4 w-4" aria-hidden="true" />
            Find nearby hospital
          </a>
        </div>
      </div>
      {alwaysVisible && !emergency?.isEmergency ? (
        <p className={`mt-4 rounded-lg border border-rose-200 bg-white/70 p-3 text-sm ${theme.subtleText}`}>
          No current high-risk alert is active. Use this center for immediate action when symptoms become severe.
        </p>
      ) : null}
    </section>
  );
}

function EmergencyModal({
  theme,
  emergency,
  guidance,
  onClose,
  onShareLocation
}: {
  theme: DashboardTheme;
  emergency?: EmergencyResult;
  guidance?: Guidance | null;
  onClose: () => void;
  onShareLocation: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="emergency-modal-title">
      <div className="w-full max-w-xl overflow-hidden rounded-[20px] border border-rose-200 bg-white text-rose-950 shadow-2xl shadow-rose-950/30">
        <div className="bg-rose-600 p-4 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white/15">
                <Siren className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-rose-100">Critical health alert</p>
                <h2 id="emergency-modal-title" className="mt-1 text-xl font-black">Seek urgent medical care now</h2>
              </div>
            </div>
            <button className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/15 text-white" type="button" onClick={onClose}>
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Close emergency modal</span>
            </button>
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm leading-6">
            {guidance?.emergencyAction || "If the person has chest pain, severe breathing difficulty, stroke signs, fainting, or worsening symptoms, call emergency services or go to the nearest hospital."}
          </p>
          {emergency?.flags?.length ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800">
              Detected red flags: {emergency.flags.join(", ")}
            </div>
          ) : null}
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <a className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-black text-white shadow-lg shadow-rose-500/25 transition hover:scale-[1.02]" href="tel:999">
              <PhoneCall className="h-4 w-4" aria-hidden="true" />
              Call emergency
            </a>
            <a className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 text-sm font-black text-rose-700 transition hover:scale-[1.02]" href="https://www.google.com/maps/search/hospital+near+me" target="_blank" rel="noreferrer">
              <MapPinned className="h-4 w-4" aria-hidden="true" />
              Nearby hospital
            </a>
            <button className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 text-sm font-black text-rose-700 transition hover:scale-[1.02]" type="button" onClick={onShareLocation}>
              <Share2 className="h-4 w-4" aria-hidden="true" />
              Share location
            </button>
          </div>
          <p className={`mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs font-semibold leading-5 ${theme.subtleText}`}>
            This AI system does not replace professional medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}

function ReportsSection({
  theme,
  reportText,
  fileName,
  loading,
  disabled,
  onChange,
  onFileNameChange,
  onDownloadReport,
  onSubmit
}: {
  theme: DashboardTheme;
  reportText: string;
  fileName: string;
  loading: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  onFileNameChange: (value: string) => void;
  onDownloadReport: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    onFileNameChange(file.name);
    const fileNameLower = file.name.toLowerCase();
    const canReadText = file.type.startsWith("text/") || fileNameLower.endsWith(".txt") || fileNameLower.endsWith(".csv");

    if (canReadText) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          onChange(reader.result.slice(0, 6000));
        }
      };
      reader.readAsText(file);
    }
  }

  return (
    <section className={`rounded-lg border p-5 shadow-xl backdrop-blur-xl ${theme.card}`}>
      <SectionHeader icon={FileText} title="Medical Reports" description="Upload or paste lab report values for a plain-language explanation." theme={theme} />
      <form className="mt-4 space-y-4" onSubmit={onSubmit}>
        <label className={`focus-within:ring-3 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center transition hover:scale-[1.01] ${theme.soft}`}>
          <input className="sr-only" type="file" accept=".txt,.csv,.pdf,.png,.jpg,.jpeg" onChange={handleFileSelection} />
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-500/25">
            <UploadCloud className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-black">{fileName || "Drag and drop a report, or choose a file"}</p>
            <p className={`mt-1 text-xs leading-5 ${theme.muted}`}>TXT/CSV auto-fill the analyzer. PDF/image OCR can be connected next.</p>
          </div>
        </label>

        <div className="grid gap-3 lg:grid-cols-2">
          <article className={`rounded-lg border p-4 ${theme.input}`}>
            <div className="flex items-center gap-2 text-sm font-black">
              <FileSearch className="h-4 w-4 text-blue-500" aria-hidden="true" />
              Report preview
            </div>
            <p className={`mt-2 line-clamp-4 text-xs leading-5 ${theme.muted}`}>
              {reportText || fileName || "Paste values such as hemoglobin, WBC, glucose, cholesterol, TSH, or other lab markers."}
            </p>
          </article>
          <article className={`rounded-lg border p-4 ${theme.input}`}>
            <p className="text-sm font-black">AI explanation panel</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-black text-blue-700">Simple summary</span>
              <span className="rounded-full border border-amber-100 bg-amber-50 px-2 py-1 text-[11px] font-black text-amber-700">Abnormal values</span>
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700">Risk indicators</span>
            </div>
            <button className={`focus-ring mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-xs font-black ${theme.input}`} type="button" onClick={onDownloadReport}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Download PDF
            </button>
          </article>
        </div>

        <textarea
          className={`focus-ring min-h-56 w-full resize-y rounded-lg border p-4 text-sm leading-6 outline-none transition ${theme.input}`}
          placeholder="Paste CBC, glucose, lipid profile, thyroid, or other report values..."
          value={reportText}
          onChange={(event) => onChange(event.target.value)}
          maxLength={6000}
          required
        />
        <PrimaryButton loading={loading} disabled={disabled} icon={FileText} label="Analyze Report" />
      </form>
    </section>
  );
}

function ChatWidget({
  theme,
  turns,
  value,
  loading,
  aiTyping,
  disabled,
  expanded = false,
  onChange,
  onSubmit
}: {
  theme: DashboardTheme;
  turns: ChatTurn[];
  value: string;
  loading: boolean;
  aiTyping: boolean;
  disabled: boolean;
  expanded?: boolean;
  onChange: (value: string) => void;
  onSubmit: (event?: FormEvent, suggestion?: string) => void;
}) {
  return (
    <section className={`rounded-lg border p-5 shadow-xl backdrop-blur-xl ${theme.card}`}>
      <SectionHeader icon={Bot} title="AI Chat Assistant" description="Ask safe healthcare questions with clear next steps." theme={theme} />
      <div className={`mt-4 grid gap-3 overflow-y-auto rounded-lg border p-3 ${expanded ? "max-h-[520px]" : "max-h-[360px]"} ${theme.soft}`}>
        {turns.map((turn) => (
          <div
            key={turn.id}
            className={`max-w-[86%] rounded-lg p-3 text-sm leading-6 shadow-sm ${
              turn.role === "user" ? "ml-auto bg-blue-600 text-white" : `border ${theme.input}`
            }`}
          >
            <p className="whitespace-pre-line">{turn.content}</p>
            <div className={`mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold ${turn.role === "user" ? "text-blue-100" : theme.muted}`}>
              <span>{turn.timestamp || "Now"}</span>
              {turn.risk ? <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2 py-1 font-black text-blue-700">{turn.risk} risk</span> : null}
            </div>
          </div>
        ))}
        {aiTyping ? (
          <div className={`mr-auto inline-flex w-fit items-center gap-2 rounded-lg border p-3 text-xs font-bold shadow-sm ${theme.input}`} aria-live="polite">
            <span className="inline-flex items-center gap-1" aria-hidden="true">
              <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:120ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:240ms]" />
            </span>
            AI is typing
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {chatSuggestions.map((suggestion) => (
          <button key={suggestion} className={`focus-ring rounded-lg border px-3 py-2 text-xs font-bold transition hover:scale-[1.02] ${theme.input}`} type="button" onClick={() => void onSubmit(undefined, suggestion)}>
            {suggestion}
          </button>
        ))}
      </div>
      <form className={`sticky bottom-0 mt-3 flex gap-2 rounded-lg pt-3 ${theme.cardSolid}`} onSubmit={onSubmit}>
        <input
          className={`focus-ring min-h-11 flex-1 rounded-lg border px-3 text-sm outline-none ${theme.input}`}
          placeholder="Message the assistant..."
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={2000}
        />
        <button className="focus-ring grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20 transition hover:scale-[1.04]" disabled={loading || disabled} type="submit">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
          <span className="sr-only">Send message</span>
        </button>
      </form>
    </section>
  );
}

function HistorySection({
  theme,
  darkMode,
  items,
  warning,
  loading,
  onRefresh,
  onViewDetails
}: {
  theme: DashboardTheme;
  darkMode: boolean;
  items: DashboardHistoryItem[];
  warning: string;
  loading: boolean;
  onRefresh: () => void;
  onViewDetails: (item: DashboardHistoryItem) => void;
}) {
  return (
    <section className={`rounded-lg border p-5 shadow-xl backdrop-blur-xl ${theme.card}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader icon={History} title="History Timeline" description="Review previous symptoms, AI summaries, and risk levels." theme={theme} />
        <button className={`focus-ring inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-bold ${theme.input}`} disabled={loading} onClick={onRefresh} type="button">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <History className="h-4 w-4" aria-hidden="true" />}
          Refresh
        </button>
      </div>
      {warning ? <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">{warning}</p> : null}
      <div className="mt-4 grid gap-3">
        {items.length ? (
          items.map((item) => (
            <HistoryCard
              key={item.id}
              title={`${item.type}: ${item.title}`}
              body={item.body}
              guidance={item.guidance}
              fallbackRisk={item.fallbackRisk}
              createdAt={item.createdAt}
              darkMode={darkMode}
              onViewDetails={() => onViewDetails(item)}
            />
          ))
        ) : (
          <div className={`rounded-lg border border-dashed p-6 text-center text-sm ${theme.soft}`}>
            No saved history yet. Run a symptom check, chat, or report analysis first.
          </div>
        )}
      </div>
    </section>
  );
}

function SettingsSection({
  theme,
  profile,
  loading,
  language,
  darkMode,
  onProfileChange,
  onSubmit,
  onToggleDark,
  onToggleLanguage,
  healthChecksCount,
  reportsCount,
  totalInteractions,
  onSecurityAction,
  onExportData,
  onExportPdf
}: {
  theme: DashboardTheme;
  profile: UserProfile;
  loading: boolean;
  language: Language;
  darkMode: boolean;
  onProfileChange: (profile: UserProfile | ((current: UserProfile) => UserProfile)) => void;
  onSubmit: (event: FormEvent) => void;
  onToggleDark: () => void;
  onToggleLanguage: () => void;
  healthChecksCount: number;
  reportsCount: number;
  totalInteractions: number;
  onSecurityAction: (label: string) => void;
  onExportData: () => void;
  onExportPdf: () => void;
}) {
  return (
    <section className={`rounded-lg border p-5 shadow-xl backdrop-blur-xl ${theme.card}`}>
      <SectionHeader icon={Settings} title="Settings" description="Manage patient profile, language, and appearance preferences." theme={theme} />
      <div className="mt-5 grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={`rounded-lg border p-4 ${theme.input}`}>
          <div className="flex items-center gap-3">
            <Avatar name={profile.name || "Demo Patient"} photoURL={profile.photoURL} size="lg" />
            <div>
              <p className="text-lg font-black">{profile.name || "Demo Patient"}</p>
              <p className={`text-sm font-bold ${theme.muted}`}>{profile.role || "patient"} profile</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <ProfileStat label="Checks" value={healthChecksCount.toString()} />
            <ProfileStat label="Reports" value={reportsCount.toString()} />
            <ProfileStat label="Saved" value={totalInteractions.toString()} />
          </div>
          <div className={`mt-4 rounded-lg border p-3 text-xs leading-5 ${theme.soft}`}>
            Saved history is tied to your secure Firebase account and synced to MongoDB when storage is available.
          </div>
        </aside>

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <button className={`focus-ring flex min-h-12 items-center justify-between rounded-lg border px-4 text-sm font-bold ${theme.input}`} type="button" onClick={onToggleDark}>
              <span className="inline-flex items-center gap-2">{darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} Dark mode</span>
              {darkMode ? "On" : "Off"}
            </button>
            <button className={`focus-ring flex min-h-12 items-center justify-between rounded-lg border px-4 text-sm font-bold ${theme.input}`} type="button" onClick={onToggleLanguage}>
              <span className="inline-flex items-center gap-2"><Languages className="h-4 w-4" /> Language</span>
              {language}
            </button>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput theme={theme} label="Name" value={profile.name || ""} onChange={(value) => onProfileChange((prev) => ({ ...prev, name: value }))} />
              <TextInput theme={theme} label="Email" type="email" value={profile.email || ""} onChange={(value) => onProfileChange((prev) => ({ ...prev, email: value }))} />
              <TextInput theme={theme} label="Age" type="number" value={profile.age?.toString() || ""} onChange={(value) => onProfileChange((prev) => ({ ...prev, age: value ? Number(value) : undefined }))} />
              <TextInput theme={theme} label="District" value={profile.district || ""} onChange={(value) => onProfileChange((prev) => ({ ...prev, district: value }))} />
              <label className={`grid gap-1 text-sm font-bold ${theme.subtleText}`}>
                Role / Gender
                <select className={`focus-ring min-h-11 rounded-lg border px-3 text-sm outline-none ${theme.input}`} value={profile.gender || ""} onChange={(event) => onProfileChange((prev) => ({ ...prev, gender: event.target.value }))}>
                  <option value="">Select</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </label>
              <TextInput theme={theme} label="Blood Group" value={profile.bloodGroup || ""} onChange={(value) => onProfileChange((prev) => ({ ...prev, bloodGroup: value }))} />
            </div>
            <label className={`grid gap-1 text-sm font-bold ${theme.subtleText}`}>
              Known Conditions
              <input
                className={`focus-ring min-h-11 rounded-lg border px-3 text-sm outline-none ${theme.input}`}
                placeholder="Diabetes, asthma, hypertension"
                value={(profile.knownConditions || []).join(", ")}
                onChange={(event) =>
                  onProfileChange((prev) => ({
                    ...prev,
                    knownConditions: event.target.value.split(",").map((item) => item.trim())
                  }))
                }
              />
            </label>
            <PrimaryButton loading={loading} disabled={loading} icon={Save} label="Save Settings" />
          </form>

          <div className={`rounded-lg border p-4 ${theme.input}`}>
            <div className="flex items-center gap-2 text-sm font-black">
              <LockKeyhole className="h-4 w-4 text-blue-500" aria-hidden="true" />
              Security and data controls
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <SecurityAction icon={KeyRound} label="Password" onClick={onSecurityAction} />
              <SecurityAction icon={ShieldCheck} label="Two-factor auth" onClick={onSecurityAction} />
              <SecurityAction icon={Database} label="Export JSON" onClick={onExportData} />
              <SecurityAction icon={Download} label="Download PDF" onClick={onExportPdf} />
            </div>
            <p className={`mt-3 text-xs leading-5 ${theme.muted}`}>
              Export JSON for machine-readable backup, or download a print-ready PDF summary for patient records.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-center text-blue-950">
      <p className="text-lg font-black">{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-blue-600">{label}</p>
    </div>
  );
}

function SecurityAction({
  icon: Icon,
  label,
  onClick
}: {
  icon: LucideIcon;
  label: string;
  onClick: (label: string) => void;
}) {
  return (
    <button className="focus-ring flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 text-xs font-black text-blue-700 transition hover:scale-[1.02]" type="button" onClick={() => onClick(label)}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

function SystemStatusStrip({
  theme,
  status,
  lastSource,
  historyWarning,
  totalInteractions
}: {
  theme: DashboardTheme;
  status: SystemStatus | null;
  lastSource: GuidanceSource | null;
  historyWarning: string;
  totalInteractions: number;
}) {
  return (
    <section className="mt-4 grid gap-3 sm:grid-cols-3">
      <StatusTile theme={theme} icon={Sparkles} label="AI mode" value={status?.openaiConfigured ? `OpenAI ${status.model}` : "Safe fallback"} tone={status?.openaiConfigured ? "good" : "warn"} />
      <StatusTile theme={theme} icon={Database} label="Storage" value={status?.storageAvailable ? "MongoDB connected" : "Storage offline"} tone={status?.storageAvailable ? "good" : "warn"} />
      <StatusTile theme={theme} icon={historyWarning ? AlertCircle : CheckCircle2} label={sourceLabel(lastSource)} value={`${totalInteractions} saved items`} tone={historyWarning ? "warn" : "neutral"} />
    </section>
  );
}

function StatusTile({
  theme,
  icon: Icon,
  label,
  value,
  tone
}: {
  theme: DashboardTheme;
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "good" | "warn" | "neutral";
}) {
  const styles = {
    good: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warn: "border-amber-200 bg-amber-50 text-amber-900",
    neutral: theme.cardSolid
  }[tone];

  return (
    <article className={`rounded-lg border p-3 shadow-lg ${styles}`}>
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </article>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  theme
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  theme: DashboardTheme;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-lg font-black">{title}</h2>
        <p className={`mt-1 text-sm leading-5 ${theme.muted}`}>{description}</p>
      </div>
    </div>
  );
}

function PrimaryButton({
  loading,
  disabled,
  icon: Icon,
  label
}: {
  loading: boolean;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:scale-[1.02] sm:w-auto"
      disabled={loading || disabled}
      type="submit"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
      {loading ? "Analyzing..." : label}
    </button>
  );
}

function TextInput({
  theme,
  label,
  value,
  onChange,
  type = "text"
}: {
  theme: DashboardTheme;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className={`grid gap-1 text-sm font-bold ${theme.subtleText}`}>
      {label}
      <input
        className={`focus-ring min-h-11 rounded-lg border px-3 text-sm outline-none ${theme.input}`}
        min={type === "number" ? 0 : undefined}
        max={type === "number" ? 130 : undefined}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed right-4 top-4 z-50 grid w-[min(360px,calc(100vw-32px))] gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`animate-card-in rounded-lg border px-4 py-3 text-sm font-bold shadow-xl backdrop-blur ${
            toast.tone === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : toast.tone === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

function FloatingSos({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="focus-ring fixed bottom-5 right-5 z-40 inline-flex min-h-12 items-center gap-2 rounded-lg bg-rose-600 px-4 py-3 text-sm font-black text-white shadow-2xl shadow-rose-500/30 transition hover:scale-[1.03]"
      type="button"
      onClick={onClick}
    >
      <Siren className="h-5 w-5" aria-hidden="true" />
      Emergency SOS
    </button>
  );
}

function toneClass(tone: string) {
  if (tone === "rose") return "bg-rose-50 text-rose-600";
  if (tone === "amber") return "bg-amber-50 text-amber-600";
  if (tone === "emerald") return "bg-emerald-50 text-emerald-600";
  if (tone === "cyan") return "bg-cyan-50 text-cyan-600";
  return "bg-blue-50 text-blue-600";
}
