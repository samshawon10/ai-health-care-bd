import { env } from "../config/env.js";
import { getFirebaseAdminAuth, hasFirebaseAdminConfig } from "../config/firebaseAdmin.js";

function bearerToken(req) {
  const header = req.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || "";
}

export async function verifyFirebaseAuth(req, res, next) {
  if (!hasFirebaseAdminConfig()) {
    if (env.firebaseAdminRequired) {
      return res.status(503).json({
        code: "FIREBASE_ADMIN_NOT_CONFIGURED",
        error: "Firebase Admin credentials are required but not configured."
      });
    }

    req.firebaseUser = null;
    return next();
  }

  const token = bearerToken(req);
  if (!token) {
    return res.status(401).json({
      code: "AUTH_REQUIRED",
      error: "A Firebase ID token is required."
    });
  }

  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(token);
    req.firebaseUser = {
      uid: decoded.uid,
      email: decoded.email || "",
      name: decoded.name || "",
      photoURL: decoded.picture || ""
    };
    return next();
  } catch {
    return res.status(401).json({
      code: "INVALID_AUTH_TOKEN",
      error: "Firebase session is invalid or expired."
    });
  }
}

export function requireMatchingFirebaseUser(source, fieldName = "userId") {
  return function enforceFirebaseOwner(req, res, next) {
    if (!req.firebaseUser) {
      return next();
    }

    const sourceValue = source === "body" ? req.body?.[fieldName] : source === "query" ? req.query?.[fieldName] : req.params?.[fieldName];
    if (!sourceValue) {
      return next();
    }

    if (String(sourceValue) !== req.firebaseUser.uid) {
      return res.status(403).json({
        code: "AUTH_USER_MISMATCH",
        error: "You can only access your own healthcare records."
      });
    }

    return next();
  };
}
