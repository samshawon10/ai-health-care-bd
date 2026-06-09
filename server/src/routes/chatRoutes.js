import { Router } from "express";
import { getChatSession, listChatSessions, sendChatMessage } from "../controllers/chatController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireMatchingFirebaseUser, verifyFirebaseAuth } from "../middleware/firebaseAuth.js";
import { validate } from "../middleware/validate.js";
import { chatMessageSchema } from "../validators/schemas.js";

export const chatRoutes = Router();

chatRoutes.post("/", verifyFirebaseAuth, validate(chatMessageSchema), requireMatchingFirebaseUser("body"), asyncHandler(sendChatMessage));
chatRoutes.get("/", verifyFirebaseAuth, requireMatchingFirebaseUser("query"), asyncHandler(listChatSessions));
chatRoutes.get("/:id", verifyFirebaseAuth, asyncHandler(getChatSession));
