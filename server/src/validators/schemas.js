import { z } from "zod";

const optionalString = z.string().trim().optional().default("");
const patchString = z.string().trim().optional();
const roleSchema = z.enum(["super_admin", "doctor", "patient", "guardian", "child_care", "clinic_admin"]);
const statusSchema = z.enum(["active", "pending", "banned"]);

export const symptomCheckSchema = z.object({
  userId: z.string().trim().min(1).default("guest"),
  symptoms: z.string().trim().min(3, "Please describe your symptoms."),
  age: z.coerce.number().min(0).max(130).optional(),
  sex: optionalString,
  location: optionalString
});

export const chatMessageSchema = z.object({
  userId: z.string().trim().min(1).default("guest"),
  sessionId: z.string().trim().optional(),
  message: z.string().trim().min(3, "Please enter a health question.")
});

export const reportAnalysisSchema = z.object({
  userId: z.string().trim().min(1).default("guest"),
  reportText: z.string().trim().min(10, "Paste enough report text to analyze.")
});

export const profileSchema = z.object({
  uid: optionalString,
  name: optionalString,
  email: z.string().trim().email().optional().or(z.literal("")).default(""),
  photoURL: z.string().trim().url().optional().or(z.literal("")).default(""),
  role: roleSchema.optional().default("patient"),
  status: statusSchema.optional().default("active"),
  specialty: optionalString,
  licenseNumber: optionalString,
  assignedPatientIds: z.array(z.string().trim()).optional().default([]),
  assignedDoctorIds: z.array(z.string().trim()).optional().default([]),
  dependentIds: z.array(z.string().trim()).optional().default([]),
  age: z.coerce.number().min(0).max(130).optional(),
  gender: z
    .enum(["female", "male", "other", "prefer_not_to_say", ""])
    .optional()
    .default(""),
  district: optionalString,
  bloodGroup: optionalString,
  knownConditions: z.array(z.string().trim()).optional().default([])
});

export const adminUserAccessSchema = z.object({
  role: roleSchema.optional(),
  status: statusSchema.optional(),
  assignedPatientIds: z.array(z.string().trim().min(1)).optional(),
  assignedDoctorIds: z.array(z.string().trim().min(1)).optional(),
  dependentIds: z.array(z.string().trim().min(1)).optional(),
  specialty: patchString,
  licenseNumber: patchString
});

export const childProfileSchema = z.object({
  name: z.string().trim().min(1, "Child name is required."),
  age: z.coerce.number().min(0).max(18).optional(),
  gender: z
    .enum(["female", "male", "other", "prefer_not_to_say", ""])
    .optional()
    .default(""),
  bloodGroup: optionalString,
  knownConditions: z.array(z.string().trim()).optional().default([]),
  relationship: optionalString
});

export const clinicalNoteSchema = z.object({
  patientId: z.string().trim().min(1, "Patient is required."),
  type: z.enum(["note", "prescription", "patient_message"]).optional().default("note"),
  title: optionalString,
  content: z.string().trim().min(3, "Clinical note content is required."),
  status: z.enum(["draft", "sent", "archived"]).optional().default("sent")
});
