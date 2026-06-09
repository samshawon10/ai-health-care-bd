import { z } from "zod";

const optionalString = z.string().trim().optional().default("");

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
  role: z.enum(["patient", "doctor", "clinic_admin"]).optional().default("patient"),
  age: z.coerce.number().min(0).max(130).optional(),
  gender: z
    .enum(["female", "male", "other", "prefer_not_to_say", ""])
    .optional()
    .default(""),
  district: optionalString,
  bloodGroup: optionalString,
  knownConditions: z.array(z.string().trim()).optional().default([])
});
