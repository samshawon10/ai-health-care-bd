import { Router } from "express";
import { getProfile, upsertProfile } from "../controllers/userController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireMatchingFirebaseUser, verifyFirebaseAuth } from "../middleware/firebaseAuth.js";
import { validate } from "../middleware/validate.js";
import { profileSchema } from "../validators/schemas.js";

export const userRoutes = Router();

userRoutes.get("/profile/:clientId", verifyFirebaseAuth, requireMatchingFirebaseUser("params", "clientId"), asyncHandler(getProfile));
userRoutes.put("/profile/:clientId", verifyFirebaseAuth, validate(profileSchema), requireMatchingFirebaseUser("params", "clientId"), asyncHandler(upsertProfile));
