import { ReportAnalysis } from "../models/ReportAnalysis.js";
import { isDbConnected } from "../config/db.js";
import { detectEmergency } from "../services/emergencyService.js";
import { analyzeReportText } from "../services/openaiService.js";
import { getStoredProfile } from "../services/profileService.js";

export async function analyzeReport(req, res) {
  const { userId, reportText } = req.body;
  const emergency = detectEmergency(reportText);
  const profile = await getStoredProfile(userId);
  const aiResult = await analyzeReportText({
    reportText,
    profile,
    emergency
  });

  let record = null;
  let saved = false;
  let storageError = null;

  if (isDbConnected()) {
    try {
      record = await ReportAnalysis.create({
        userId,
        reportText,
        guidance: aiResult.guidance,
        aiModel: aiResult.model,
        source: aiResult.source
      });
      saved = true;
    } catch (error) {
      console.error("Failed to save report analysis:", error.message);
      storageError = "Report analysis was generated but could not be saved.";
    }
  }

  res.status(201).json({
    saved,
    report: record,
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

export async function listReports(req, res) {
  if (!isDbConnected()) {
    return res.json({
      reports: [],
      storageAvailable: false,
      warning: "Database is not connected."
    });
  }

  const userId = req.query.userId || req.firebaseUser?.uid || "guest";
  const reports = await ReportAnalysis.find({ userId })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  res.json({ reports, storageAvailable: true });
}
