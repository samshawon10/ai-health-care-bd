"use client";

import Link from "next/link";
import {
  Activity,
  Bell,
  ClipboardList,
  FileText,
  HeartPulse,
  History,
  LayoutDashboard,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Siren,
  Stethoscope,
  UserCog,
  UsersRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { HealthcareDashboard } from "@/components/HealthcareDashboard";
import { Button, Card, Field, MedicalDisclaimer, RiskBadge, TextArea } from "@/components/ui-system";
import {
  createChildProfile,
  createClinicalNote,
  getRoleDashboard,
  listPlatformUsers,
  updateUserAccess
} from "@/lib/api";
import { formatPdfDate } from "@/lib/pdfExport";
import type { ChildProfile, HealthCheck, ReportAnalysis, RoleDashboardData, UserProfile, UserRole, UserStatus } from "@/types/health";

type NormalizedRole = "super_admin" | "doctor" | "patient" | "guardian";

const roleLabels: Record<NormalizedRole, string> = {
  super_admin: "Super Admin",
  doctor: "Doctor",
  patient: "Patient",
  guardian: "Child Care"
};

const roleMenus: Record<NormalizedRole, Array<{ label: string; icon: LucideIcon }>> = {
  super_admin: [
    { label: "Overview", icon: LayoutDashboard },
    { label: "User Management", icon: UsersRound },
    { label: "AI Usage", icon: Activity },
    { label: "Emergency Monitor", icon: Siren }
  ],
  doctor: [
    { label: "Doctor Dashboard", icon: LayoutDashboard },
    { label: "Patients", icon: UsersRound },
    { label: "AI Summaries", icon: Stethoscope },
    { label: "Prescriptions", icon: ClipboardList }
  ],
  patient: [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Symptom Checker", icon: Stethoscope },
    { label: "Chat Assistant", icon: MessageCircle },
    { label: "History", icon: History }
  ],
  guardian: [
    { label: "Child Profiles", icon: UsersRound },
    { label: "Health Alerts", icon: Bell },
    { label: "Emergency", icon: Siren },
    { label: "Reports", icon: FileText }
  ]
};

function normalizeRole(role?: UserRole | RoleDashboardData["role"]): NormalizedRole {
  if (role === "super_admin" || role === "clinic_admin") return "super_admin";
  if (role === "doctor") return "doctor";
  if (role === "guardian" || role === "child_care") return "guardian";
  return "patient";
}

function cardValue(cards: Record<string, number> | undefined, key: string) {
  return cards?.[key] ?? 0;
}

export function RoleBasedDashboard({ requiredRole }: { requiredRole?: NormalizedRole }) {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<RoleDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getRoleDashboard();
      setDashboard(response.dashboard);
      setWarning(response.warning || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load role dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    getRoleDashboard()
      .then((response) => {
        if (!active) return;
        setDashboard(response.dashboard);
        setWarning(response.warning || "");
        setError("");
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Could not load role dashboard.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const role = normalizeRole(dashboard?.role);

  if (loading) {
    return <RoleGate message="Loading your role-based healthcare workspace..." />;
  }

  if (error || !dashboard) {
    return <RoleError message={error || "Role dashboard is unavailable."} onRetry={loadDashboard} />;
  }

  if (requiredRole && role !== requiredRole) {
    return <AccessDenied currentRole={role} requiredRole={requiredRole} />;
  }

  if (role === "patient") {
    return <HealthcareDashboard />;
  }

  return (
    <RoleShell role={role} name={user?.displayName || dashboard.profile?.name || dashboard.doctor?.name || dashboard.guardian?.name || "Healthcare user"} warning={warning}>
      {role === "super_admin" ? <AdminDashboard dashboard={dashboard} /> : null}
      {role === "doctor" ? <DoctorDashboard dashboard={dashboard} onRefresh={loadDashboard} /> : null}
      {role === "guardian" ? <GuardianDashboard dashboard={dashboard} onRefresh={loadDashboard} /> : null}
    </RoleShell>
  );
}

function RoleShell({ role, name, warning, children }: { role: NormalizedRole; name: string; warning?: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#eef7ff_0%,#f8fafc_48%,#ecfdf5_100%)] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-white/80 bg-white/82 p-4 shadow-xl shadow-blue-100/60 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <Link className="flex items-center gap-3" href="/dashboard">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
              <HeartPulse className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-black">AI Healthcare</p>
              <p className="text-xs font-bold text-slate-500">{roleLabels[role]} workspace</p>
            </div>
          </Link>
          <nav className="mt-6 grid gap-2" aria-label={`${roleLabels[role]} navigation`}>
            {roleMenus[role].map(({ label, icon: Icon }) => (
              <button key={label} className="focus-ring flex min-h-11 items-center gap-3 rounded-lg border border-transparent px-3 text-left text-sm font-black text-slate-600 transition hover:border-blue-100 hover:bg-blue-50" type="button">
                <Icon className="h-4 w-4 text-blue-600" aria-hidden="true" />
                {label}
              </button>
            ))}
          </nav>
          <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs font-bold leading-5 text-blue-900">
            Role access is enforced on every API request. Emergency alerts remain visible across all clinical roles.
          </div>
        </aside>

        <section className="min-w-0 p-4 sm:p-6 lg:p-8">
          <header className="mb-6 flex flex-col gap-4 rounded-[20px] border border-white/80 bg-white/82 p-4 shadow-xl shadow-blue-100/60 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">{roleLabels[role]} Dashboard</p>
              <h1 className="mt-1 text-2xl font-black md:text-3xl">Welcome back, {name}</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">Secure role-based workspace for Bangladesh healthcare operations.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="focus-within:ring-3 flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
                <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <input className="w-44 bg-transparent text-sm font-bold outline-none placeholder:text-slate-400" placeholder="Search records" />
              </div>
              <Button variant="secondary" icon={Bell}>Alerts</Button>
            </div>
          </header>
          {warning ? <RoleNotice tone="warning" message={warning} /> : null}
          {children}
          <div className="mt-6">
            <MedicalDisclaimer compact />
          </div>
        </section>
      </div>
    </main>
  );
}

function RoleNotice({ tone, message }: { tone: "success" | "warning" | "error"; message: string }) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-rose-200 bg-rose-50 text-rose-800"
  }[tone];

  return (
    <p className={`mb-4 rounded-lg border p-3 text-sm font-bold ${styles}`} role={tone === "error" ? "alert" : "status"} aria-live="polite">
      {message}
    </p>
  );
}

function StatGrid({ items }: { items: Array<{ label: string; value: number | string; tone?: "blue" | "green" | "amber" | "red" }> }) {
  const toneClass = {
    blue: "border-blue-100 bg-blue-50 text-blue-900",
    green: "border-emerald-100 bg-emerald-50 text-emerald-900",
    amber: "border-amber-100 bg-amber-50 text-amber-900",
    red: "border-rose-100 bg-rose-50 text-rose-900"
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article key={item.label} className={`rounded-lg border p-4 ${toneClass[item.tone || "blue"]}`}>
          <p className="text-2xl font-black">{item.value}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-wide opacity-75">{item.label}</p>
        </article>
      ))}
    </div>
  );
}

function AdminDashboard({ dashboard }: { dashboard: RoleDashboardData }) {
  const [users, setUsers] = useState<UserProfile[]>(dashboard.recentUsers || []);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; message: string } | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);
  const [savingId, setSavingId] = useState("");

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setNotice(null);
    try {
      const response = await listPlatformUsers();
      setUsers(response.users);
      if (response.warning) {
        setNotice({ tone: "warning", message: response.warning });
      }
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not load platform users." });
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    listPlatformUsers()
      .then((response) => {
        if (!active) return;
        setUsers(response.users);
        if (response.warning) setNotice({ tone: "warning", message: response.warning });
      })
      .catch((error) => {
        if (active) setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not load platform users." });
      })
      .finally(() => {
        if (active) setUsersLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function applyAccess(user: UserProfile, role: UserRole, nextStatus: UserStatus) {
    if (!user.clientId) return;
    setSavingId(user.clientId);
    setNotice(null);
    try {
      const response = await updateUserAccess(user.clientId, { role, status: nextStatus });
      setUsers((current) => current.map((item) => (item.clientId === user.clientId ? response.user : item)));
      setNotice({ tone: "success", message: "User access updated." });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not update user access." });
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="space-y-5">
      <StatGrid
        items={[
          { label: "Total users", value: cardValue(dashboard.cards, "totalUsers") },
          { label: "Doctors", value: cardValue(dashboard.cards, "doctors"), tone: "green" },
          { label: "Emergency alerts", value: cardValue(dashboard.cards, "highRiskChecks"), tone: "red" },
          { label: "AI generations", value: dashboard.aiUsage?.totalGenerations || 0, tone: "amber" }
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <Card hover={false}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black">User Management</h2>
              <p className="text-sm font-semibold text-slate-500">Approve, ban, and assign healthcare roles.</p>
            </div>
            <Button variant="secondary" icon={UserCog} onClick={() => void loadUsers()}>Refresh</Button>
          </div>
          {notice ? <div className="mt-3"><RoleNotice tone={notice.tone} message={notice.message} /></div> : null}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="border-b border-slate-200 py-3">User</th>
                  <th className="border-b border-slate-200 py-3">Role</th>
                  <th className="border-b border-slate-200 py-3">Status</th>
                  <th className="border-b border-slate-200 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? <AdminTableSkeleton /> : null}
                {!usersLoading
                  ? users.map((item) => (
                      <AdminUserRow key={item.clientId || item.uid || item.email} user={item} saving={savingId === item.clientId} onApply={applyAccess} />
                    ))
                  : null}
              </tbody>
            </table>
            {!usersLoading && users.length === 0 ? <EmptyState title="No users found" body="New Firebase sign-ins will appear here after profile sync." /> : null}
          </div>
        </Card>

        <Card hover={false}>
          <h2 className="text-lg font-black">System Analytics</h2>
          <div className="mt-4 grid gap-3">
            <AnalyticsLine label="Health checks" value={dashboard.aiUsage?.healthChecks || 0} />
            <AnalyticsLine label="Chat sessions" value={dashboard.aiUsage?.chatSessions || 0} />
            <AnalyticsLine label="Report analyses" value={dashboard.aiUsage?.reports || 0} />
          </div>
          <div className="mt-5 rounded-lg border border-rose-100 bg-rose-50 p-3">
            <p className="text-sm font-black text-rose-900">Emergency monitor</p>
            <div className="mt-3 grid gap-2">
              {(dashboard.recentAlerts || []).slice(0, 4).map((alert) => (
                <AlertLine key={alert._id} alert={alert} />
              ))}
              {dashboard.recentAlerts?.length ? null : <p className="text-sm font-semibold text-rose-700">No high-risk alerts found.</p>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function AdminTableSkeleton() {
  return (
    <>
      {[0, 1, 2].map((item) => (
        <tr key={item} className="border-b border-slate-100">
          <td className="py-3"><span className="block h-4 w-40 animate-pulse rounded bg-slate-100" /></td>
          <td className="py-3"><span className="block h-10 w-28 animate-pulse rounded-lg bg-slate-100" /></td>
          <td className="py-3"><span className="block h-10 w-28 animate-pulse rounded-lg bg-slate-100" /></td>
          <td className="py-3"><span className="block h-10 w-20 animate-pulse rounded-lg bg-slate-100" /></td>
        </tr>
      ))}
    </>
  );
}

function AdminUserRow({
  user,
  saving,
  onApply
}: {
  user: UserProfile;
  saving: boolean;
  onApply: (user: UserProfile, role: UserRole, status: UserStatus) => Promise<void>;
}) {
  const [role, setRole] = useState<UserRole>(user.role || "patient");
  const [status, setStatus] = useState<UserStatus>(user.status || "active");

  return (
    <tr className="border-b border-slate-100">
      <td className="py-3">
        <p className="font-black text-slate-950">{user.name || "Unnamed user"}</p>
        <p className="text-xs font-semibold text-slate-500">{user.email || user.clientId}</p>
      </td>
      <td className="py-3">
        <select className="focus-ring min-h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm font-bold" value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
          <option value="guardian">Child Care</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </td>
      <td className="py-3">
        <select className="focus-ring min-h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm font-bold" value={status} onChange={(event) => setStatus(event.target.value as UserStatus)}>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="banned">Banned</option>
        </select>
      </td>
      <td className="py-3">
        <Button variant="secondary" loading={saving} onClick={() => void onApply(user, role, status)}>Apply</Button>
      </td>
    </tr>
  );
}

function DoctorDashboard({ dashboard, onRefresh }: { dashboard: RoleDashboardData; onRefresh: () => Promise<void> }) {
  const patients = dashboard.assignedPatients || [];
  const [patientId, setPatientId] = useState(patients[0]?.clientId || "");
  const [noteType, setNoteType] = useState<"note" | "prescription" | "patient_message">("note");
  const [content, setContent] = useState("");
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setSaving(true);
    try {
      await createClinicalNote({
        patientId,
        type: noteType,
        title: noteType === "prescription" ? "Prescription" : "Clinical note",
        content
      });
      setContent("");
      setNotice({ tone: "success", message: "Clinical note saved to the patient record." });
      await onRefresh();
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not save clinical note." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <StatGrid
        items={[
          { label: "Assigned patients", value: cardValue(dashboard.cards, "assignedPatients") },
          { label: "High-risk cases", value: cardValue(dashboard.cards, "highRiskCases"), tone: "red" },
          { label: "Reports to review", value: cardValue(dashboard.cards, "pendingReports"), tone: "amber" },
          { label: "Consultations", value: cardValue(dashboard.cards, "activeConsultations"), tone: "green" }
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <Card hover={false}>
            <h2 className="text-lg font-black">Assigned Patients</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {patients.map((patient) => (
                <article key={patient.clientId || patient.uid || patient.email} className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="font-black">{patient.name || "Patient"}</p>
                  <p className="text-xs font-semibold text-slate-500">{patient.email || patient.clientId}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                    <span className="rounded-full bg-blue-50 px-2 py-1">District: {patient.district || "N/A"}</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-1">Blood: {patient.bloodGroup || "N/A"}</span>
                  </div>
                </article>
              ))}
              {patients.length ? null : <EmptyState title="No assigned patients" body="Ask an admin to assign patients to this doctor account." />}
            </div>
          </Card>

          <Card hover={false}>
            <h2 className="text-lg font-black">AI Symptom Summaries</h2>
            <RecordList checks={dashboard.healthChecks || []} />
          </Card>
        </div>

        <Card hover={false}>
          <h2 className="text-lg font-black">Medical Notes and Prescriptions</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Save clinician notes for assigned patients.</p>
          <form className="mt-4 grid gap-3" onSubmit={submitNote}>
            <label className="grid gap-1 text-sm font-bold text-slate-700">
              Patient
              <select className="focus-ring min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none" value={patientId} onChange={(event) => setPatientId(event.target.value)} required>
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.clientId || patient.uid || patient.email} value={patient.clientId}>
                    {patient.name || patient.email || patient.clientId}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-bold text-slate-700">
              Type
              <select className="focus-ring min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none" value={noteType} onChange={(event) => setNoteType(event.target.value as typeof noteType)}>
                <option value="note">Medical note</option>
                <option value="prescription">Prescription</option>
                <option value="patient_message">Patient message</option>
              </select>
            </label>
            <TextArea label="Content" placeholder="Assessment, plan, prescription instructions, or follow-up note..." value={content} onChange={(event) => setContent(event.target.value)} required />
            {notice ? <RoleNotice tone={notice.tone} message={notice.message} /> : null}
            <Button loading={saving} disabled={!patientId || content.trim().length < 3} icon={ClipboardList} type="submit">Save note</Button>
          </form>
          <ReportMiniList reports={dashboard.reports || []} />
        </Card>
      </div>
    </div>
  );
}

function GuardianDashboard({ dashboard, onRefresh }: { dashboard: RoleDashboardData; onRefresh: () => Promise<void> }) {
  const [form, setForm] = useState({ name: "", age: "", bloodGroup: "", relationship: "Guardian" });
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function submitChild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      await createChildProfile({
        name: form.name,
        age: form.age ? Number(form.age) : undefined,
        bloodGroup: form.bloodGroup,
        relationship: form.relationship,
        knownConditions: []
      });
      setForm({ name: "", age: "", bloodGroup: "", relationship: "Guardian" });
      setNotice({ tone: "success", message: "Child profile added." });
      await onRefresh();
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not add child profile." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <StatGrid
        items={[
          { label: "Children", value: cardValue(dashboard.cards, "children") },
          { label: "Emergency alerts", value: cardValue(dashboard.cards, "emergencyAlerts"), tone: "red" },
          { label: "Reports", value: cardValue(dashboard.cards, "reports"), tone: "amber" },
          { label: "AI chats", value: cardValue(dashboard.cards, "conversations"), tone: "green" }
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card hover={false}>
          <h2 className="text-lg font-black">Child Profiles</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(dashboard.childProfiles || []).map((child) => (
              <ChildProfileCard key={child.childId} child={child} />
            ))}
            {dashboard.childProfiles?.length ? null : <EmptyState title="No child profiles" body="Add a child profile to monitor health alerts and history." />}
          </div>
        </Card>

        <Card hover={false}>
          <h2 className="text-lg font-black">Add Child Profile</h2>
          <form className="mt-4 grid gap-3" onSubmit={submitChild}>
            <Field label="Child name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            <Field label="Age" type="number" min={0} max={18} value={form.age} onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))} />
            <Field label="Blood group" value={form.bloodGroup} onChange={(event) => setForm((current) => ({ ...current, bloodGroup: event.target.value }))} />
            <Field label="Relationship" value={form.relationship} onChange={(event) => setForm((current) => ({ ...current, relationship: event.target.value }))} />
            {notice ? <RoleNotice tone={notice.tone} message={notice.message} /> : null}
            <Button loading={saving} disabled={form.name.trim().length < 1} icon={Plus} type="submit">Add child</Button>
          </form>
        </Card>
      </div>

      <Card hover={false}>
        <h2 className="text-lg font-black">Child Health Alerts</h2>
        <RecordList checks={dashboard.healthChecks || []} />
      </Card>
    </div>
  );
}

function RecordList({ checks }: { checks: HealthCheck[] }) {
  return (
    <div className="mt-4 grid gap-3">
      {checks.slice(0, 8).map((check) => (
        <article key={check._id} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-black">{formatPdfDate(check.createdAt)}</p>
            <RiskBadge risk={check.guidance?.riskLevel || "Low"} />
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-600">{check.symptoms}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">{check.guidance?.recommendation}</p>
        </article>
      ))}
      {checks.length ? null : <EmptyState title="No records yet" body="New AI analyses will appear here once saved." />}
    </div>
  );
}

function ReportMiniList({ reports }: { reports: ReportAnalysis[] }) {
  return (
    <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-black">Recent reports</p>
      <div className="mt-3 grid gap-2">
        {reports.slice(0, 4).map((report) => (
          <div key={report._id} className="rounded-lg bg-white p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="font-black">{report.guidance?.possibleCondition || "Report analysis"}</p>
              <RiskBadge risk={report.guidance?.riskLevel || "Low"} />
            </div>
            <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500">{report.reportText}</p>
          </div>
        ))}
        {reports.length ? null : <p className="text-sm font-semibold text-slate-500">No reports assigned yet.</p>}
      </div>
    </div>
  );
}

function ChildProfileCard({ child }: { child: ChildProfile }) {
  return (
    <article className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-emerald-950">
      <p className="font-black">{child.name}</p>
      <p className="text-xs font-bold opacity-75">{child.relationship || "Guardian"} profile</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold">
        <span className="rounded-lg bg-white/70 p-2">Age: {child.age ?? "N/A"}</span>
        <span className="rounded-lg bg-white/70 p-2">Blood: {child.bloodGroup || "N/A"}</span>
      </div>
    </article>
  );
}

function AnalyticsLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
      <span className="text-sm font-bold text-slate-600">{label}</span>
      <strong className="text-lg">{value}</strong>
    </div>
  );
}

function AlertLine({ alert }: { alert: HealthCheck }) {
  return (
    <article className="rounded-lg bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black text-rose-900">{formatPdfDate(alert.createdAt)}</p>
        <RiskBadge risk={alert.guidance?.riskLevel || "High"} />
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-600">{alert.symptoms}</p>
    </article>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm">
      <p className="font-black text-slate-700">{title}</p>
      <p className="mt-1 font-semibold text-slate-500">{body}</p>
    </div>
  );
}

function RoleGate({ message }: { message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_52%,#ecfdf5_100%)] px-4">
      <section className="rounded-[20px] border border-white/80 bg-white/86 p-6 text-center shadow-2xl shadow-blue-100/70 backdrop-blur-xl">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" aria-hidden="true" />
        <p className="mt-3 text-sm font-black text-slate-700">{message}</p>
      </section>
    </main>
  );
}

function RoleError({ message, onRetry }: { message: string; onRetry: () => Promise<void> }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-slate-950">
      <Card hover={false} className="max-w-md text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" aria-hidden="true" />
        <h1 className="mt-3 text-xl font-black">Dashboard unavailable</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">{message}</p>
        <Button className="mt-4" onClick={() => void onRetry()}>Try again</Button>
      </Card>
    </main>
  );
}

function AccessDenied({ currentRole, requiredRole }: { currentRole: NormalizedRole; requiredRole: NormalizedRole }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-slate-950">
      <Card hover={false} className="max-w-md text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-blue-600" aria-hidden="true" />
        <h1 className="mt-3 text-xl font-black">Role access required</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          This page is for {roleLabels[requiredRole]} users. Your current role is {roleLabels[currentRole]}.
        </p>
        <Link href="/dashboard">
          <Button className="mt-4">Go to my dashboard</Button>
        </Link>
      </Card>
    </main>
  );
}
