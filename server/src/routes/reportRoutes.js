import { Router } from "express";
import { analyzeReport, listReports } from "../controllers/reportController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { verifyFirebaseAuth } from "../middleware/firebaseAuth.js";
import { attachUserContext, requireUserAccess } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { reportAnalysisSchema } from "../validators/schemas.js";

export const reportRoutes = Router();

reportRoutes.use(verifyFirebaseAuth, attachUserContext);
reportRoutes.post("/analyze", validate(reportAnalysisSchema), requireUserAccess("body"), asyncHandler(analyzeReport));
reportRoutes.get("/", requireUserAccess("query"), asyncHandler(listReports));
