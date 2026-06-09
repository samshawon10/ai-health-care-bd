import { Router } from "express";
import { createClinicalNote, listClinicalNotes } from "../controllers/clinicalNoteController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { verifyFirebaseAuth } from "../middleware/firebaseAuth.js";
import { attachUserContext, requireAuthenticated } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { clinicalNoteSchema } from "../validators/schemas.js";

export const clinicalNoteRoutes = Router();

clinicalNoteRoutes.use(verifyFirebaseAuth, attachUserContext);
clinicalNoteRoutes.get("/", requireAuthenticated, asyncHandler(listClinicalNotes));
clinicalNoteRoutes.post("/", requireAuthenticated, validate(clinicalNoteSchema), asyncHandler(createClinicalNote));
