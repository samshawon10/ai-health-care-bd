import { Router } from "express";
import { createHealthCheck, getHealthCheck, listHealthChecks } from "../controllers/healthController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireMatchingFirebaseUser, verifyFirebaseAuth } from "../middleware/firebaseAuth.js";
import { validate } from "../middleware/validate.js";
import { symptomCheckSchema } from "../validators/schemas.js";

export const healthRoutes = Router();

healthRoutes.post("/", verifyFirebaseAuth, validate(symptomCheckSchema), requireMatchingFirebaseUser("body"), asyncHandler(createHealthCheck));
healthRoutes.get("/", verifyFirebaseAuth, requireMatchingFirebaseUser("query"), asyncHandler(listHealthChecks));
healthRoutes.get("/:id", verifyFirebaseAuth, asyncHandler(getHealthCheck));
