import { Router } from "express";
import { createHealthCheck, getHealthCheck, listHealthChecks } from "../controllers/healthController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { verifyFirebaseAuth } from "../middleware/firebaseAuth.js";
import { attachUserContext, requireUserAccess } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { symptomCheckSchema } from "../validators/schemas.js";

export const healthRoutes = Router();

healthRoutes.use(verifyFirebaseAuth, attachUserContext);
healthRoutes.post("/", validate(symptomCheckSchema), requireUserAccess("body"), asyncHandler(createHealthCheck));
healthRoutes.get("/", requireUserAccess("query"), asyncHandler(listHealthChecks));
healthRoutes.get("/:id", asyncHandler(getHealthCheck));
