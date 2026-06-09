import mongoose from "mongoose";
import { guidanceSchema } from "./HealthCheck.js";

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    guidance: guidanceSchema,
    emergencyFlags: {
      type: [String],
      default: []
    }
  },
  { timestamps: true, _id: true }
);

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      trim: true,
      default: "Health conversation"
    },
    messages: {
      type: [messageSchema],
      default: []
    },
    lastRiskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low"
    },
    aiModel: String
  },
  { timestamps: true }
);

export const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
