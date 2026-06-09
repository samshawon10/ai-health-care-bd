import { Router } from "express";
import { createClinicalNote, listClinicalNotes } from "../controllers/clinicalNoteController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { verifyFirebaseAuth } from "../middleware/firebaseAuth.js";
import { attachUserContext } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { clinicalNoteSchema } from "../validators/schemas.js";

export const clinicalNoteRoutes = Router();

clinicalNoteRoutes.use(verifyFirebaseAuth, attachUserContext);
clinicalNoteRoutes.get("/", asyncHandler(listClinicalNotes));
clinicalNoteRoutes.post("/", validate(clinicalNoteSchema), asyncHandler(createClinicalNote));
