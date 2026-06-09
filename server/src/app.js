import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env, isProduction } from "./config/env.js";
import { isDbConnected } from "./config/db.js";
import { hasFirebaseAdminConfig } from "./config/firebaseAdmin.js";
import { chatRoutes } from "./routes/chatRoutes.js";
import { clinicalNoteRoutes } from "./routes/clinicalNoteRoutes.js";
import { healthRoutes } from "./routes/healthRoutes.js";
import { reportRoutes } from "./routes/reportRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

function statusPayload() {
  return {
    status: "ok",
    database: isDbConnected() ? "connected" : "disconnected",
    storageAvailable: isDbConnected(),
    firebaseAdminConfigured: hasFirebaseAdminConfig(),
    firebaseAdminRequired: env.firebaseAdminRequired,
    openaiConfigured: Boolean(env.openaiApiKey),
    aiMode: env.openaiApiKey ? "openai" : "fallback",
    model: env.openaiModel,
    emergencyAiSkipped: env.openaiSkipEmergencyAi
  };
}

function corsOrigin(origin, callback) {
  if (!origin || env.clientOrigins.includes("*") || env.clientOrigins.includes(origin)) {
    return callback(null, true);
  }

  const error = new Error("Origin is not allowed by CORS.");
  error.statusCode = 403;
  error.code = "CORS_NOT_ALLOWED";
  return callback(error);
}

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(isProduction ? "combined" : "dev"));
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 60,
      standardHeaders: "draft-8",
      legacyHeaders: false
    })
  );

  app.get("/health", (req, res) => res.json(statusPayload()));
  app.get("/api/status", (req, res) => res.json(statusPayload()));

  app.use("/api/health-checks", healthRoutes);
  app.use("/api/chats", chatRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/clinical-notes", clinicalNoteRoutes);
  app.use("/api/users", userRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
