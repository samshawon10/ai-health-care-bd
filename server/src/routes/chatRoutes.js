import { Router } from "express";
import { getChatSession, listChatSessions, sendChatMessage } from "../controllers/chatController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { verifyFirebaseAuth } from "../middleware/firebaseAuth.js";
import { attachUserContext, requireUserAccess } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { chatMessageSchema } from "../validators/schemas.js";

export const chatRoutes = Router();

chatRoutes.use(verifyFirebaseAuth, attachUserContext);
chatRoutes.post("/", validate(chatMessageSchema), requireUserAccess("body"), asyncHandler(sendChatMessage));
chatRoutes.get("/", requireUserAccess("query"), asyncHandler(listChatSessions));
chatRoutes.get("/:id", asyncHandler(getChatSession));
