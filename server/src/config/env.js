import dotenv from "dotenv";

dotenv.config();

function parseBoolean(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseOrigins() {
  const raw = process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || "http://localhost:3000";
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function parseList(value = "") {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseNumber(process.env.PORT, 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  clientOrigins: parseOrigins(),
  mongodbUri: process.env.MONGODB_URI || "",
  mongodbRequired: parseBoolean(process.env.MONGODB_REQUIRED, process.env.NODE_ENV === "production"),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY || "",
  firebaseAdminRequired: parseBoolean(process.env.FIREBASE_ADMIN_REQUIRED, process.env.NODE_ENV === "production"),
  superAdminEmails: parseList(process.env.SUPER_ADMIN_EMAILS || "").map((email) => email.toLowerCase()),
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  openaiRequestTimeoutMs: parseNumber(process.env.OPENAI_REQUEST_TIMEOUT_MS, 20000),
  openaiMaxInputChars: parseNumber(process.env.OPENAI_MAX_INPUT_CHARS, 6000),
  openaiSkipEmergencyAi: parseBoolean(process.env.OPENAI_SKIP_EMERGENCY_AI, true)
};

export const isProduction = env.nodeEnv === "production";

export function validateRuntimeConfig() {
  const missing = [];

  if (isProduction && !env.clientOrigins.length) {
    missing.push("CLIENT_ORIGIN or CLIENT_ORIGINS");
  }

  if (env.mongodbRequired && !env.mongodbUri) {
    missing.push("MONGODB_URI");
  }

  if (env.firebaseAdminRequired) {
    if (!env.firebaseProjectId) missing.push("FIREBASE_PROJECT_ID");
    if (!env.firebaseClientEmail) missing.push("FIREBASE_CLIENT_EMAIL");
    if (!env.firebasePrivateKey) missing.push("FIREBASE_PRIVATE_KEY");
  }

  if (isProduction && !env.openaiApiKey) {
    missing.push("OPENAI_API_KEY");
  }

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
