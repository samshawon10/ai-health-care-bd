import { randomUUID } from "node:crypto";
import { User } from "../models/User.js";
import { ChatSession } from "../models/ChatSession.js";
import { HealthCheck } from "../models/HealthCheck.js";
import { ReportAnalysis } from "../models/ReportAnalysis.js";
import { isDbConnected } from "../config/db.js";
import { ROLE, isAdminRole, isGuardianRole, normalizeRole, permittedUserFilter } from "../middleware/rbac.js";

const userPublicProjection = "-__v";

function compactUser(user) {
  if (!user) return null;

  return {
    ...user,
    normalizedRole: normalizeRole(user.role)
  };
}

function sanitizeProfileUpdate(req, existingUser) {
  const body = { ...req.body };
  const actorIsAdmin = req.authUser && isAdminRole(req.authUser.role);

  if (!actorIsAdmin) {
    delete body.role;
    delete body.status;
    delete body.assignedPatientIds;
    delete body.assignedDoctorIds;
    delete body.dependentIds;
    delete body.childProfiles;
    delete body.specialty;
    delete body.licenseNumber;
  }

  return {
    ...body,
    role: actorIsAdmin && body.role ? body.role : existingUser?.role || "patient",
    status: actorIsAdmin && body.status ? body.status : existingUser?.status || "active"
  };
}

export async function getProfile(req, res) {
  if (!isDbConnected()) {
    return res.json({
      user: null,
      storageAvailable: false,
      warning: "Database is not connected."
    });
  }

  const user = await User.findOne({ clientId: req.params.clientId }).select(userPublicProjection).lean();
  res.json({ user: compactUser(user), storageAvailable: true });
}

export async function upsertProfile(req, res) {
  if (!isDbConnected()) {
    return res.status(503).json({
      code: "DB_UNAVAILABLE",
      error: "Profile storage is unavailable because MongoDB is not connected."
    });
  }

  const existingUser = await User.findOne({ clientId: req.params.clientId }).lean();
  const safeUpdate = sanitizeProfileUpdate(req, existingUser);
  const user = await User.findOneAndUpdate(
    { clientId: req.params.clientId },
    {
      $set: {
        clientId: req.params.clientId,
        ...safeUpdate
      }
    },
    {
      new: true,
      upsert: true,
      runValidators: true
    }
  ).lean();

  res.json({ user: compactUser(user) });
}

export async function listUsers(req, res) {
  if (!isDbConnected()) {
    return res.json({
      users: [],
      storageAvailable: false,
      warning: "Database is not connected."
    });
  }

  const role = req.query.role ? String(req.query.role) : "";
  const status = req.query.status ? String(req.query.status) : "";
  const filter = {
    ...(role ? { role } : {}),
    ...(status ? { status } : {})
  };

  const users = await User.find(filter).select(userPublicProjection).sort({ createdAt: -1 }).limit(100).lean();
  res.json({ users: users.map(compactUser), storageAvailable: true });
}

export async function updateUserAccess(req, res) {
  if (!isDbConnected()) {
    return res.status(503).json({
      code: "DB_UNAVAILABLE",
      error: "User management is unavailable because MongoDB is not connected."
    });
  }

  const allowedFields = [
    "role",
    "status",
    "assignedPatientIds",
    "assignedDoctorIds",
    "dependentIds",
    "specialty",
    "licenseNumber"
  ];
  const update = Object.fromEntries(allowedFields.filter((field) => field in req.body).map((field) => [field, req.body[field]]));

  const user = await User.findOneAndUpdate(
    { clientId: req.params.clientId },
    { $set: update },
    { new: true, runValidators: true }
  )
    .select(userPublicProjection)
    .lean();

  if (!user) {
    return res.status(404).json({
      code: "USER_NOT_FOUND",
      error: "User was not found."
    });
  }

  res.json({ user: compactUser(user) });
}

async function adminDashboard() {
  const [
    totalUsers,
    activeUsers,
    pendingUsers,
    bannedUsers,
    doctors,
    patients,
    guardians,
    healthChecks,
    chatSessions,
    reports,
    highRiskChecks,
    recentUsers,
    recentAlerts
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: "active" }),
    User.countDocuments({ status: "pending" }),
    User.countDocuments({ status: "banned" }),
    User.countDocuments({ role: "doctor" }),
    User.countDocuments({ role: "patient" }),
    User.countDocuments({ role: { $in: ["guardian", "child_care"] } }),
    HealthCheck.countDocuments(),
    ChatSession.countDocuments(),
    ReportAnalysis.countDocuments(),
    HealthCheck.countDocuments({
      $or: [{ "guidance.riskLevel": "High" }, { emergencyFlags: { $exists: true, $ne: [] } }]
    }),
    User.find().select(userPublicProjection).sort({ createdAt: -1 }).limit(8).lean(),
    HealthCheck.find({
      $or: [{ "guidance.riskLevel": "High" }, { emergencyFlags: { $exists: true, $ne: [] } }]
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean()
  ]);

  return {
    role: ROLE.SUPER_ADMIN,
    cards: {
      totalUsers,
      activeUsers,
      pendingUsers,
      bannedUsers,
      doctors,
      patients,
      guardians,
      healthChecks,
      chatSessions,
      reports,
      highRiskChecks
    },
    recentUsers: recentUsers.map(compactUser),
    recentAlerts,
    aiUsage: {
      totalGenerations: healthChecks + chatSessions + reports,
      healthChecks,
      chatSessions,
      reports
    }
  };
}

async function doctorDashboard(req) {
  const doctor = req.authUser;
  const patientIds = doctor?.assignedPatientIds || [];
  const [patients, healthChecks, reports, chatSessions] = await Promise.all([
    User.find({ clientId: { $in: patientIds } }).select(userPublicProjection).sort({ name: 1 }).limit(50).lean(),
    HealthCheck.find({ userId: { $in: patientIds } }).sort({ createdAt: -1 }).limit(12).lean(),
    ReportAnalysis.find({ userId: { $in: patientIds } }).sort({ createdAt: -1 }).limit(12).lean(),
    ChatSession.find({ userId: { $in: patientIds } }).sort({ updatedAt: -1 }).limit(12).lean()
  ]);

  return {
    role: ROLE.DOCTOR,
    doctor: compactUser(doctor),
    assignedPatients: patients.map(compactUser),
    healthChecks,
    reports,
    chatSessions,
    cards: {
      assignedPatients: patients.length,
      highRiskCases: healthChecks.filter((item) => item.guidance?.riskLevel === "High").length,
      pendingReports: reports.length,
      activeConsultations: chatSessions.length
    }
  };
}

async function guardianDashboard(req) {
  const guardian = req.authUser;
  const childProfiles = guardian?.childProfiles || [];
  const childIds = [
    ...(guardian?.dependentIds || []),
    ...childProfiles.map((child) => child.childId)
  ];
  const [healthChecks, reports, chatSessions] = await Promise.all([
    HealthCheck.find({ userId: { $in: childIds } }).sort({ createdAt: -1 }).limit(12).lean(),
    ReportAnalysis.find({ userId: { $in: childIds } }).sort({ createdAt: -1 }).limit(12).lean(),
    ChatSession.find({ userId: { $in: childIds } }).sort({ updatedAt: -1 }).limit(12).lean()
  ]);

  return {
    role: ROLE.GUARDIAN,
    guardian: compactUser(guardian),
    childProfiles,
    healthChecks,
    reports,
    chatSessions,
    cards: {
      children: childProfiles.length,
      emergencyAlerts: healthChecks.filter((item) => item.guidance?.riskLevel === "High" || item.emergencyFlags?.length).length,
      reports: reports.length,
      conversations: chatSessions.length
    }
  };
}

async function patientDashboard(req) {
  const filter = permittedUserFilter(req, req.authUser?.clientId);
  const [healthChecks, reports, chatSessions] = await Promise.all([
    HealthCheck.find(filter).sort({ createdAt: -1 }).limit(12).lean(),
    ReportAnalysis.find(filter).sort({ createdAt: -1 }).limit(12).lean(),
    ChatSession.find(filter).sort({ updatedAt: -1 }).limit(12).lean()
  ]);

  return {
    role: ROLE.PATIENT,
    profile: compactUser(req.authUser),
    healthChecks,
    reports,
    chatSessions,
    cards: {
      healthChecks: healthChecks.length,
      highRiskCases: healthChecks.filter((item) => item.guidance?.riskLevel === "High").length,
      reports: reports.length,
      conversations: chatSessions.length
    }
  };
}

export async function getRoleDashboard(req, res) {
  if (!isDbConnected()) {
    return res.json({
      dashboard: {
        role: normalizeRole(req.authRole),
        cards: {}
      },
      storageAvailable: false,
      warning: "Database is not connected."
    });
  }

  if (isAdminRole(req.authRole)) {
    return res.json({ dashboard: await adminDashboard(req), storageAvailable: true });
  }

  if (req.authRole === ROLE.DOCTOR) {
    return res.json({ dashboard: await doctorDashboard(req), storageAvailable: true });
  }

  if (isGuardianRole(req.authRole)) {
    return res.json({ dashboard: await guardianDashboard(req), storageAvailable: true });
  }

  return res.json({ dashboard: await patientDashboard(req), storageAvailable: true });
}

export async function createChildProfile(req, res) {
  if (!isDbConnected()) {
    return res.status(503).json({
      code: "DB_UNAVAILABLE",
      error: "Child profile storage is unavailable because MongoDB is not connected."
    });
  }

  const childId = `child_${randomUUID()}`;
  const childProfile = {
    childId,
    ...req.body
  };

  const user = await User.findOneAndUpdate(
    { clientId: req.authUser.clientId },
    {
      $addToSet: { dependentIds: childId },
      $push: { childProfiles: childProfile },
      $set: { role: isGuardianRole(req.authRole) ? req.authRole : ROLE.GUARDIAN }
    },
    { new: true, runValidators: true }
  )
    .select(userPublicProjection)
    .lean();

  res.status(201).json({ childProfile, user: compactUser(user) });
}
