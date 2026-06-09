import { Router } from "express";
import { analyzeReport, listReports } from "../controllers/reportController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireMatchingFirebaseUser, verifyFirebaseAuth } from "../middleware/firebaseAuth.js";
import { validate } from "../middleware/validate.js";
import { reportAnalysisSchema } from "../validators/schemas.js";

export const reportRoutes = Router();

reportRoutes.post("/analyze", verifyFirebaseAuth, validate(reportAnalysisSchema), requireMatchingFirebaseUser("body"), asyncHandler(analyzeReport));
reportRoutes.get("/", verifyFirebaseAuth, requireMatchingFirebaseUser("query"), asyncHandler(listReports));
