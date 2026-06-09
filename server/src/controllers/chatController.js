import { ChatSession } from "../models/ChatSession.js";
import { isDbConnected } from "../config/db.js";
import { detectEmergency } from "../services/emergencyService.js";
import { answerHealthQuestion } from "../services/openaiService.js";
import { getStoredProfile } from "../services/profileService.js";

function makeTitle(message) {
  const compact = message.replace(/\s+/g, " ").trim();
  return compact.length > 48 ? `${compact.slice(0, 48)}...` : compact;
}

export async function sendChatMessage(req, res) {
  const { userId, sessionId, message } = req.body;
  const emergency = detectEmergency(message);
  const profile = await getStoredProfile(userId);
  const aiResult = await answerHealthQuestion({
    message,
    profile,
    emergency
  });

  let session = null;
  let saved = false;
  let storageError = null;

  if (isDbConnected()) {
    try {
      if (sessionId) {
        session = await ChatSession.findOne({ _id: sessionId, userId });
      }

      if (!session) {
        session = new ChatSession({
          userId,
          title: makeTitle(message),
          aiModel: aiResult.model
        });
      }

      session.messages.push({ role: "user", content: message });
      session.messages.push({
        role: "assistant",
        content: [
          `Possible Condition: ${aiResult.guidance.possibleCondition}`,
          `Risk Level: ${aiResult.guidance.riskLevel}`,
          `Explanation: ${aiResult.guidance.explanation}`,
          `Recommendation: ${aiResult.guidance.recommendation}`,
          aiResult.guidance.emergencyAction
            ? `Emergency Action: ${aiResult.guidance.emergencyAction}`
            : ""
        ]
          .filter(Boolean)
          .join("\n"),
        guidance: aiResult.guidance,
        emergencyFlags: emergency.flags
      });
      session.lastRiskLevel = aiResult.guidance.riskLevel;
      session.aiModel = aiResult.model;
      await session.save();
      saved = true;
    } catch (error) {
      console.error("Failed to save chat session:", error.message);
      storageError = "Response was generated but could not be saved.";
    }
  }

  res.status(201).json({
    saved,
    session,
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

export async function listChatSessions(req, res) {
  if (!isDbConnected()) {
    return res.json({
      sessions: [],
      storageAvailable: false,
      warning: "Database is not connected."
    });
  }

  const userId = req.query.userId || req.firebaseUser?.uid || "guest";
  const sessions = await ChatSession.find({ userId })
    .sort({ updatedAt: -1 })
    .limit(30)
    .lean();

  res.json({ sessions, storageAvailable: true });
}

export async function getChatSession(req, res) {
  if (!isDbConnected()) {
    return res.status(503).json({ error: "Database is not connected." });
  }

  const filter = { _id: req.params.id };
  if (req.firebaseUser) {
    filter.userId = req.firebaseUser.uid;
  } else if (req.query.userId) {
    filter.userId = req.query.userId;
  }

  const session = await ChatSession.findOne(filter).lean();
  if (!session) {
    return res.status(404).json({ error: "Chat session not found." });
  }

  res.json({ session });
}
