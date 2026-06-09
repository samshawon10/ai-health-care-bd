import { isDbConnected } from "../config/db.js";
import { User } from "../models/User.js";

export const ROLE = {
  SUPER_ADMIN: "super_admin",
  DOCTOR: "doctor",
  PATIENT: "patient",
  GUARDIAN: "guardian",
  CHILD_CARE: "child_care",
  CLINIC_ADMIN: "clinic_admin"
};

const ADMIN_ROLES = new Set([ROLE.SUPER_ADMIN, ROLE.CLINIC_ADMIN]);
const GUARDIAN_ROLES = new Set([ROLE.GUARDIAN, ROLE.CHILD_CARE]);

export function normalizeRole(role) {
  if (role === ROLE.CHILD_CARE) return ROLE.GUARDIAN;
  if (role === ROLE.CLINIC_ADMIN) return ROLE.SUPER_ADMIN;
  return role || ROLE.PATIENT;
}

export function isAdminRole(role) {
  return ADMIN_ROLES.has(role);
}

export function isGuardianRole(role) {
  return GUARDIAN_ROLES.has(role) || normalizeRole(role) === ROLE.GUARDIAN;
}

function firebaseClientId(req) {
  return req.firebaseUser?.uid || "";
}

export async function attachUserContext(req, res, next) {
  if (!req.firebaseUser) {
    req.authUser = null;
    req.authRole = ROLE.PATIENT;
    return next();
  }

  if (!isDbConnected()) {
    req.authUser = {
      clientId: firebaseClientId(req),
      uid: req.firebaseUser.uid,
      name: req.firebaseUser.name,
      email: req.firebaseUser.email,
      photoURL: req.firebaseUser.photoURL,
      role: ROLE.PATIENT,
      status: "active",
      assignedPatientIds: [],
      assignedDoctorIds: [],
      dependentIds: [],
      childProfiles: []
    };
    req.authRole = ROLE.PATIENT;
    return next();
  }

  const clientId = firebaseClientId(req);
  const user = await User.findOneAndUpdate(
    { clientId },
    {
      $setOnInsert: {
        clientId,
        uid: req.firebaseUser.uid,
        name: req.firebaseUser.name,
        email: req.firebaseUser.email,
        photoURL: req.firebaseUser.photoURL,
        role: ROLE.PATIENT,
        status: "active"
      },
      $set: {
        uid: req.firebaseUser.uid,
        email: req.firebaseUser.email,
        photoURL: req.firebaseUser.photoURL
      }
    },
    { new: true, upsert: true, runValidators: true }
  ).lean();

  if (user.status === "banned") {
    return res.status(403).json({
      code: "USER_BANNED",
      error: "This account has been blocked by the platform administrator."
    });
  }

  req.authUser = user;
  req.authRole = user.role || ROLE.PATIENT;
  return next();
}

export function requireRole(...roles) {
  const allowed = new Set(roles);

  return function enforceRole(req, res, next) {
    if (!req.authUser) {
      return next();
    }

    if (allowed.has(req.authRole) || (allowed.has(ROLE.SUPER_ADMIN) && isAdminRole(req.authRole))) {
      return next();
    }

    return res.status(403).json({
      code: "ROLE_FORBIDDEN",
      error: "You do not have permission to access this dashboard or API."
    });
  };
}

function sourceValue(req, source, fieldName) {
  if (source === "body") return req.body?.[fieldName];
  if (source === "query") return req.query?.[fieldName];
  return req.params?.[fieldName];
}

async function patientAllowsDoctor(patientId, doctorId) {
  if (!isDbConnected()) return false;
  const patient = await User.findOne({
    clientId: patientId,
    assignedDoctorIds: doctorId
  })
    .select("clientId")
    .lean();

  return Boolean(patient);
}

export async function canAccessUserId(req, targetUserId) {
  if (!req.authUser || !targetUserId) return true;

  const actor = req.authUser;
  const actorIds = new Set([actor.clientId, actor.uid].filter(Boolean).map(String));
  const target = String(targetUserId);

  if (actorIds.has(target)) return true;
  if (isAdminRole(actor.role)) return true;

  if (actor.role === ROLE.DOCTOR) {
    const assigned = new Set((actor.assignedPatientIds || []).map(String));
    return assigned.has(target) || patientAllowsDoctor(target, actor.clientId);
  }

  if (isGuardianRole(actor.role)) {
    const dependents = new Set([
      ...(actor.dependentIds || []),
      ...(actor.childProfiles || []).map((child) => child.childId)
    ].map(String));
    return dependents.has(target);
  }

  return false;
}

export function requireUserAccess(source, fieldName = "userId") {
  return async function enforceUserAccess(req, res, next) {
    const targetUserId = sourceValue(req, source, fieldName);

    if (!targetUserId || (await canAccessUserId(req, targetUserId))) {
      return next();
    }

    return res.status(403).json({
      code: "RBAC_USER_ACCESS_DENIED",
      error: "You can only access records permitted for your healthcare role."
    });
  };
}

export function permittedUserFilter(req, requestedUserId) {
  if (!req.authUser) {
    return requestedUserId ? { userId: requestedUserId } : {};
  }

  if (requestedUserId) {
    return { userId: requestedUserId };
  }

  const actor = req.authUser;

  if (isAdminRole(actor.role)) {
    return {};
  }

  if (actor.role === ROLE.DOCTOR) {
    return { userId: { $in: actor.assignedPatientIds || [] } };
  }

  if (isGuardianRole(actor.role)) {
    const dependentIds = [
      ...(actor.dependentIds || []),
      ...(actor.childProfiles || []).map((child) => child.childId)
    ];
    return { userId: { $in: dependentIds } };
  }

  return { userId: actor.clientId };
}
