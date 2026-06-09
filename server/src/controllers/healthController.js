import { HealthCheck } from "../models/HealthCheck.js";
import { isDbConnected } from "../config/db.js";
import { detectEmergency } from "../services/emergencyService.js";
import { assessSymptoms } from "../services/openaiService.js";
import { getStoredProfile } from "../services/profileService.js";

export async function createHealthCheck(req, res) {
  const { userId, symptoms, age, sex, location } = req.body;
  const emergency = detectEmergency(symptoms);
  const storedProfile = await getStoredProfile(userId);
  const aiResult = await assessSymptoms({
    symptoms,
    profile: {
      ...storedProfile,
      age: age ?? storedProfile.age,
      sex: sex || storedProfile.gender,
      location: location || storedProfile.district
    },
    emergency
  });

  let record = null;
  let saved = false;
  let storageError = null;

  if (isDbConnected()) {
    try {
      record = await HealthCheck.create({
        userId,
        symptoms,
        age,
        sex,
        location,
        emergencyFlags: emergency.flags,
        matchedEmergencyTerms: emergency.matchedTerms,
        guidance: aiResult.guidance,
        aiModel: aiResult.model,
        source: aiResult.source
      });
      saved = true;
    } catch (error) {
      console.error("Failed to save health check:", error.message);
      storageError = "Guidance was generated but could not be saved.";
    }
  }

  res.status(201).json({
    saved,
    healthCheck: record,
    guidance: aiResult.guidance,
    emergency,
    source: aiResult.source,
    model: aiResult.model,
    warning: aiResult.warning,
    storage: {
      available: isDbConnected(),
      saved,
      error: storageError
    }
  });
}

export async function listHealthChecks(req, res) {
  if (!isDbConnected()) {
    return res.json({
      healthChecks: [],
      storageAvailable: false,
      warning: "Database is not connected."
    });
  }

  const userId = req.query.userId || req.firebaseUser?.uid || "guest";
  const checks = await HealthCheck.find({ userId })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  res.json({ healthChecks: checks, storageAvailable: true });
}

export async function getHealthCheck(req, res) {
  if (!isDbConnected()) {
    return res.status(503).json({ error: "Database is not connected." });
  }

  const filter = { _id: req.params.id };
  if (req.firebaseUser) {
    filter.userId = req.firebaseUser.uid;
  } else if (req.query.userId) {
    filter.userId = req.query.userId;
  }

  const check = await HealthCheck.findOne(filter).lean();
  if (!check) {
    return res.status(404).json({ error: "Health check not found." });
  }

  res.json({ healthCheck: check });
}
