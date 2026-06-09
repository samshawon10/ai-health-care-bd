import { ClinicalNote } from "../models/ClinicalNote.js";
import { isDbConnected } from "../config/db.js";
import { ROLE, canAccessUserId, isAdminRole, isGuardianRole } from "../middleware/rbac.js";

export async function createClinicalNote(req, res) {
  if (!isDbConnected()) {
    return res.status(503).json({
      code: "DB_UNAVAILABLE",
      error: "Clinical note storage is unavailable because MongoDB is not connected."
    });
  }

  if (!req.authUser || (!isAdminRole(req.authRole) && req.authRole !== ROLE.DOCTOR)) {
    return res.status(403).json({
      code: "ROLE_FORBIDDEN",
      error: "Only doctors and admins can create clinical notes."
    });
  }

  if (!(await canAccessUserId(req, req.body.patientId))) {
    return res.status(403).json({
      code: "RBAC_PATIENT_ACCESS_DENIED",
      error: "This patient is not assigned to your care team."
    });
  }

  const note = await ClinicalNote.create({
    patientId: req.body.patientId,
    doctorId: req.authUser.clientId,
    type: req.body.type,
    title: req.body.title || (req.body.type === "prescription" ? "Prescription" : "Clinical note"),
    content: req.body.content,
    status: req.body.status
  });

  res.status(201).json({ note });
}

export async function listClinicalNotes(req, res) {
  if (!isDbConnected()) {
    return res.json({
      notes: [],
      storageAvailable: false,
      warning: "Database is not connected."
    });
  }

  const patientId = req.query.patientId ? String(req.query.patientId) : "";

  if (patientId && !(await canAccessUserId(req, patientId))) {
    return res.status(403).json({
      code: "RBAC_PATIENT_ACCESS_DENIED",
      error: "You do not have permission to view notes for this patient."
    });
  }

  let filter = {};
  if (patientId) {
    filter = { patientId };
  } else if (!isAdminRole(req.authRole)) {
    if (req.authRole === ROLE.DOCTOR) {
      filter = { patientId: { $in: req.authUser?.assignedPatientIds || [] } };
    } else if (isGuardianRole(req.authRole)) {
      filter = {
        patientId: {
          $in: [
            ...(req.authUser?.dependentIds || []),
            ...(req.authUser?.childProfiles || []).map((child) => child.childId)
          ]
        }
      };
    } else {
      filter = { patientId: req.authUser?.clientId };
    }
  }

  const notes = await ClinicalNote.find(filter).sort({ updatedAt: -1 }).limit(50).lean();
  res.json({ notes, storageAvailable: true });
}
